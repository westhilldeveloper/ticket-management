import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { getCurrentUser } from '@/app/lib/auth'
import { cookies } from 'next/headers'
import { startOfDay, endOfDay, subDays } from 'date-fns'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'MD'].includes(user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const departmentParam = searchParams.get('department') // optional, only for super admin
    const requestServiceType = searchParams.get('requestServiceType')

    // Determine filter for tickets based on mainCategoryId (dynamic)
    let ticketWhere = {}
    let categoryId = null

    if (user.role === 'ADMIN') {
      if (departmentParam && departmentParam !== user.department) {
        return NextResponse.json(
          { message: 'Access denied: You can only view your own department' },
          { status: 403 }
        )
      }
      if (user.department) {
        // Resolve department name to DynamicCategory ID
        const category = await prisma.dynamicCategory.findFirst({
          where: { name: user.department }
        })
        if (category) {
          categoryId = category.id
          ticketWhere.mainCategoryId = categoryId
        } else {
          // No matching category – return empty stats
          return NextResponse.json({
            stats: {
              totalTickets: 0,
              openTickets: 0,
              pendingApproval: 0,
              pendingThirdParty: 0,
              inProgress: 0,
              resolvedToday: 0,
              resolvedThisWeek: 0,
              resolvedThisMonth: 0,
              avgResponseTime: '0h',
              avgResolutionTime: '0h',
              totalUsers: 0,
              activeUsers: 0,
              newUsersToday: 0,
              newUsersThisWeek: 0,
              admins: 0,
              mds: 0,
              employees: 0,
              ticketsByCategory: { HR: 0, IT: 0, TECHNICAL: 0 },
              ticketsByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
              ticketsByStatus: {},
              mdApprovals: { pending: 0, approved: 0, rejected: 0 }
            }
          })
        }
      }
    } else if (user.role === 'SUPER_ADMIN' && departmentParam) {
      // Super admin can optionally filter by a specific department
      const category = await prisma.dynamicCategory.findFirst({
        where: { name: departmentParam }
      })
      if (category) {
        categoryId = category.id
        ticketWhere.mainCategoryId = categoryId
      } else {
        // No matching category – return empty
        return NextResponse.json({
          stats: {
            totalTickets: 0,
            openTickets: 0,
            pendingApproval: 0,
            pendingThirdParty: 0,
            inProgress: 0,
            resolvedToday: 0,
            resolvedThisWeek: 0,
            resolvedThisMonth: 0,
            avgResponseTime: '0h',
            avgResolutionTime: '0h',
            totalUsers: 0,
            activeUsers: 0,
            newUsersToday: 0,
            newUsersThisWeek: 0,
            admins: 0,
            mds: 0,
            employees: 0,
            ticketsByCategory: { HR: 0, IT: 0, TECHNICAL: 0 },
            ticketsByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
            ticketsByStatus: {},
            mdApprovals: { pending: 0, approved: 0, rejected: 0 }
          }
        })
      }
    }

    if (requestServiceType) {
      ticketWhere.requestServiceType = requestServiceType
    }

    // MD sees all, no filter (ticketWhere remains empty)

    const today = new Date()
    const startToday = startOfDay(today)
    const endToday = endOfDay(today)
    const startWeek = subDays(today, 7)
    const startMonth = subDays(today, 30)

    const [
      totalTickets,
      openTickets,
      pendingApproval,
      pendingThirdParty,
      inProgress,
      resolvedToday,
      resolvedThisWeek,
      resolvedThisMonth,
      ticketsByCategory,
      ticketsByPriority,
      ticketsByStatus,
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      roleCounts,
      mdApprovals
    ] = await Promise.all([
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({
        where: {
          ...ticketWhere,
          status: { in: ['OPEN', 'PENDING_MD_APPROVAL', 'PENDING_THIRD_PARTY', 'IN_PROGRESS'] }
        }
      }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'PENDING_MD_APPROVAL' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'PENDING_THIRD_PARTY' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({
        where: { ...ticketWhere, status: 'RESOLVED', updatedAt: { gte: startToday, lte: endToday } }
      }),
      prisma.ticket.count({
        where: { ...ticketWhere, status: 'RESOLVED', updatedAt: { gte: startWeek } }
      }),
      prisma.ticket.count({
        where: { ...ticketWhere, status: 'RESOLVED', updatedAt: { gte: startMonth } }
      }),
      prisma.ticket.groupBy({ by: ['category'], _count: true, where: ticketWhere }),
      prisma.ticket.groupBy({ by: ['priority'], _count: true, where: ticketWhere }),
      prisma.ticket.groupBy({ by: ['status'], _count: true, where: ticketWhere }),
      prisma.user.count(),
      prisma.user.count({ where: { updatedAt: { gte: startMonth }, isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: startToday, lte: endToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startWeek } } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.ticket.groupBy({
        by: ['mdApproval'],
        _count: true,
        where: { ...ticketWhere, mdApproval: { not: null } }
      })
    ])

    // Format results (unchanged)
    const categoryCounts = { HR: 0, IT: 0, TECHNICAL: 0 }
    ticketsByCategory.forEach(item => { categoryCounts[item.category] = item._count })

    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    ticketsByPriority.forEach(item => { priorityCounts[item.priority] = item._count })

    const statusCounts = {}
    ticketsByStatus.forEach(item => { statusCounts[item.status] = item._count })

    const roleStats = { admins: 0, mds: 0, employees: 0 }
    roleCounts.forEach(item => {
      if (item.role === 'ADMIN' || item.role === 'SUPER_ADMIN') roleStats.admins += item._count
      else if (item.role === 'MD') roleStats.mds = item._count
      else if (item.role === 'EMPLOYEE') roleStats.employees = item._count
    })

    const mdApprovalStats = { pending: 0, approved: 0, rejected: 0 }
    mdApprovals.forEach(item => {
      if (item.mdApproval === 'PENDING') mdApprovalStats.pending = item._count
      else if (item.mdApproval === 'APPROVED') mdApprovalStats.approved = item._count
      else if (item.mdApproval === 'REJECTED') mdApprovalStats.rejected = item._count
    })

    const avgResponseTime = '2.5h'
    const avgResolutionTime = '24h'

    return NextResponse.json({
      stats: {
        totalTickets,
        openTickets,
        pendingApproval,
        pendingThirdParty,
        inProgress,
        resolvedToday,
        resolvedThisWeek,
        resolvedThisMonth,
        avgResponseTime,
        avgResolutionTime,
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        ...roleStats,
        ticketsByCategory: categoryCounts,
        ticketsByPriority: priorityCounts,
        ticketsByStatus: statusCounts,
        mdApprovals: mdApprovalStats
      }
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}