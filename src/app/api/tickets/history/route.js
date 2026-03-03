// app/api/tickets/history/route.js
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
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
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

    // Build where clause with ROLE-BASED ACCESS
    let where = {}

    // 🔐 ROLE-BASED ACCESS CONTROL
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        // Admins see everything
        break
        
      case 'MD':
        where = {
          OR: [
            {
              ticket: {
                mdApproval: 'PENDING',
                status: 'PENDING_MD_APPROVAL'
              }
            },
            {
              ticket: {
                OR: [
                  { assignedToId: user.id },
                  { createdById: user.id }
                ]
              }
            }
          ]
        }
        break
        
      case 'EMPLOYEE':
        where = {
          ticket: {
            createdById: user.id
          }
        }
        break
        
      default:
        return NextResponse.json(
          { message: 'Unauthorized role' },
          { status: 403 }
        )
    }

    // Apply user filter for admins
    if (userId && userId !== 'ALL' && ['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      if (where.OR) {
        where = {
          AND: [
            { OR: where.OR },
            { createdById: userId }
          ]
        }
      } else {
        where.createdById = userId
      }
    }

    // Filter by action type
    if (action && action !== 'ALL') {
      if (where.AND) {
        where.AND.push({ action })
      } else if (where.OR) {
        where = {
          AND: [
            { OR: where.OR },
            { action }
          ]
        }
      } else {
        where.action = action
      }
    }

    // Filter by category
    if (category && category !== 'ALL') {
      const categoryFilter = {
        ticket: {
          category: category
        }
      }
      
      if (where.AND) {
        where.AND.push(categoryFilter)
      } else if (where.OR) {
        where = {
          AND: [
            { OR: where.OR },
            categoryFilter
          ]
        }
      } else {
        where = {
          ...where,
          ...categoryFilter
        }
      }
    }

    // Filter by date range
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

      const dateFilter = {
        createdAt: {
          gte: startDate
        }
      }

      if (where.AND) {
        where.AND.push(dateFilter)
      } else if (where.OR) {
        where = {
          AND: [
            { OR: where.OR },
            dateFilter
          ]
        }
      } else {
        where = {
          ...where,
          ...dateFilter
        }
      }
    }

    // Search in ticket title or description
    if (search && search.trim() !== '') {
      const searchFilter = {
        OR: [
          {
            ticket: {
              title: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            description: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            ticket: {
              ticketNumber: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        ]
      }

      if (where.AND) {
        where.AND.push(searchFilter)
      } else if (where.OR) {
        where = {
          AND: [
            { OR: where.OR },
            searchFilter
          ]
        }
      } else {
        where = {
          ...where,
          ...searchFilter
        }
      }
    }

    // Get total count for pagination
    const total = await prisma.ticketHistory.count({ where })

    // Get history with pagination
    const history = await prisma.ticketHistory.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true
          }
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
            assignedToId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // Get most active day using Prisma's API instead of raw SQL
    let mostActiveDay = null
    
    try {
      if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        // For admins - count all history entries by date
        const dailyCounts = await prisma.ticketHistory.groupBy({
          by: ['createdAt'],
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 1
        })
        
        if (dailyCounts.length > 0) {
          mostActiveDay = dailyCounts[0].createdAt
        }
      } else {
        // For non-admins - count only their relevant tickets
        let ticketIds = []
        
        if (user.role === 'MD') {
          // Get tickets relevant to MD
          const tickets = await prisma.ticket.findMany({
            where: {
              OR: [
                { mdApproval: 'PENDING', status: 'PENDING_MD_APPROVAL' },
                { assignedToId: user.id },
                { createdById: user.id }
              ]
            },
            select: { id: true }
          })
          ticketIds = tickets.map(t => t.id)
        } else {
          // For employees - just their tickets
          const tickets = await prisma.ticket.findMany({
            where: { createdById: user.id },
            select: { id: true }
          })
          ticketIds = tickets.map(t => t.id)
        }
        
        if (ticketIds.length > 0) {
          const dailyCounts = await prisma.ticketHistory.groupBy({
            by: ['createdAt'],
            where: {
              ticketId: {
                in: ticketIds
              }
            },
            _count: {
              id: true
            },
            orderBy: {
              _count: {
                id: 'desc'
              }
            },
            take: 1
          })
          
          if (dailyCounts.length > 0) {
            mostActiveDay = dailyCounts[0].createdAt
          }
        }
      }
    } catch (err) {
      console.error('Error calculating most active day:', err)
      // Don't fail the whole request if this fails
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