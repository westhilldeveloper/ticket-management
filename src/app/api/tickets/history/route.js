import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { getCurrentUser } from '@/app/lib/auth'
import { cookies } from 'next/headers'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const action = searchParams.get('action')
    const dateRange = searchParams.get('dateRange')
    const search = searchParams.get('search')
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const skip = (page - 1) * limit

    // ---------- ROLE-BASED BASE WHERE ----------
    let baseWhere = {}

    switch (user.role) {
      case 'SUPER_ADMIN':
        // Super admin sees everything – no extra filters
        break

      case 'ADMIN': {
        // Admin sees only tickets from their own department
        if (!user.department) {
          // No department assigned → return nothing
          baseWhere = { id: null } // trick to get empty result
          break
        }
        const deptCategory = await prisma.dynamicCategory.findFirst({
          where: { name: user.department }
        })
        if (!deptCategory) {
          // Department name doesn't exist in DynamicCategory → return nothing
          baseWhere = { id: null }
          break
        }
        // Filter history entries to only those tickets whose mainCategoryId matches the admin's department
        baseWhere = {
          ticket: {
            mainCategoryId: deptCategory.id
          }
        }
        break
      }

      case 'MD':
        baseWhere = {
          OR: [
            { ticket: { mdApproval: 'PENDING', status: 'PENDING_MD_APPROVAL' } },
            { ticket: { assignedToId: user.id } },
            { ticket: { createdById: user.id } }
          ]
        }
        break

      case 'EMPLOYEE':
        baseWhere = { ticket: { createdById: user.id } }
        break

      default:
        return NextResponse.json({ message: 'Unauthorized role' }, { status: 403 })
    }

    // If baseWhere is set to { id: null }, we can immediately return empty
    // (but we continue to merge filters – they will never match)
    let where = { ...baseWhere }

    // ---------- APPLY ADDITIONAL FILTERS ----------
    const filters = []

    // 1. User filter (who performed the action) – only for SUPER_ADMIN and ADMIN
    if (userId && userId !== 'ALL' && ['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      filters.push({ createdById: userId })
    }

    // 2. Action type filter
    if (action && action !== 'ALL') {
      filters.push({ action })
    }

    // 3. Category filter (string field, optional)
    if (category && category !== 'ALL') {
      filters.push({ ticket: { category } })
    }

    // 4. Date range filter
    if (dateRange && dateRange !== 'ALL') {
      const now = new Date()
      let startDate = new Date()
      switch (dateRange) {
        case 'TODAY':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'WEEK':
          startDate.setDate(now.getDate() - 7)
          break
        case 'MONTH':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'YEAR':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      filters.push({ createdAt: { gte: startDate } })
    }

    // 5. Search filter (ticket title, description, ticketNumber)
    if (search && search.trim() !== '') {
      filters.push({
        OR: [
          { ticket: { title: { contains: search, mode: 'insensitive' } } },
          { description: { contains: search, mode: 'insensitive' } },
          { ticket: { ticketNumber: { contains: search, mode: 'insensitive' } } }
        ]
      })
    }

    // Merge all filters with AND
    if (filters.length > 0) {
      // If baseWhere already has an OR (like MD), wrap everything in AND
      if (baseWhere.OR) {
        where = {
          AND: [
            { OR: baseWhere.OR },
            ...filters
          ]
        }
      } else {
        // Otherwise, spread baseWhere and add AND with filters
        where = {
          ...baseWhere,
          AND: filters
        }
      }
    }

    // ---------- FETCH DATA ----------
    const total = await prisma.ticketHistory.count({ where })

    const history = await prisma.ticketHistory.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, role: true, email: true }
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            category: true,
            status: true,
            mdApproval: true,
            createdById: true,
            assignedToId: true,
            mainCategoryId: true  // include for debugging
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // ---------- MOST ACTIVE DAY ----------
    let mostActiveDay = null
    try {
      // Use the same where clause for counting (we can remove extra includes)
      const dailyCounts = await prisma.ticketHistory.groupBy({
        by: ['createdAt'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1
      })
      if (dailyCounts.length > 0) {
        mostActiveDay = dailyCounts[0].createdAt
      }
    } catch (err) {
      console.error('Error calculating most active day:', err)
    }

    return NextResponse.json({
      history,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      mostActiveDay
    })

  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}