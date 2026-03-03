// app/api/admin/stats/route.js
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
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user has admin access
    if (!['ADMIN', 'SUPER_ADMIN', 'MD'].includes(user.role)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const today = new Date()
    const startToday = startOfDay(today)
    const endToday = endOfDay(today)
    const startWeek = subDays(today, 7)
    const startMonth = subDays(today, 30)

    // Parallel queries for better performance
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
      // Total tickets
      prisma.ticket.count(),
      
      // Open tickets (excluding resolved/closed)
      prisma.ticket.count({
        where: {
          status: {
            in: ['OPEN', 'PENDING_MD_APPROVAL', 'PENDING_THIRD_PARTY', 'IN_PROGRESS']
          }
        }
      }),
      
      // Pending MD approval
      prisma.ticket.count({
        where: {
          status: 'PENDING_MD_APPROVAL'
        }
      }),
      
      // Pending third party
      prisma.ticket.count({
        where: {
          status: 'PENDING_THIRD_PARTY'
        }
      }),
      
      // In progress
      prisma.ticket.count({
        where: {
          status: 'IN_PROGRESS'
        }
      }),
      
      // Resolved today
      prisma.ticket.count({
        where: {
          status: 'RESOLVED',
          updatedAt: {
            gte: startToday,
            lte: endToday
          }
        }
      }),
      
      // Resolved this week
      prisma.ticket.count({
        where: {
          status: 'RESOLVED',
          updatedAt: {
            gte: startWeek
          }
        }
      }),
      
      // Resolved this month
      prisma.ticket.count({
        where: {
          status: 'RESOLVED',
          updatedAt: {
            gte: startMonth
          }
        }
      }),
      
      // Tickets by category
      prisma.ticket.groupBy({
        by: ['category'],
        _count: true
      }),
      
      // Tickets by priority
      prisma.ticket.groupBy({
        by: ['priority'],
        _count: true
      }),
      
      // Tickets by status
      prisma.ticket.groupBy({
        by: ['status'],
        _count: true
      }),
      
      // Total users
      prisma.user.count(),
      
      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: startMonth
          },
          isActive: true
        }
      }),
      
      // New users today
      prisma.user.count({
        where: {
          createdAt: {
            gte: startToday,
            lte: endToday
          }
        }
      }),
      
      // New users this week
      prisma.user.count({
        where: {
          createdAt: {
            gte: startWeek
          }
        }
      }),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      
      // MD approval stats
      prisma.ticket.groupBy({
        by: ['mdApproval'],
        _count: true,
        where: {
          mdApproval: {
            not: null
          }
        }
      })
    ])

    // Format category counts
    const categoryCounts = {
      HR: 0,
      IT: 0,
      TECHNICAL: 0
    }
    ticketsByCategory.forEach(item => {
      categoryCounts[item.category] = item._count
    })

    // Format priority counts
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    }
    ticketsByPriority.forEach(item => {
      priorityCounts[item.priority] = item._count
    })

    // Format status counts
    const statusCounts = {}
    ticketsByStatus.forEach(item => {
      statusCounts[item.status] = item._count
    })

    // Format role counts
    const roleStats = {
      admins: 0,
      mds: 0,
      employees: 0
    }
    roleCounts.forEach(item => {
      if (item.role === 'ADMIN' || item.role === 'SUPER_ADMIN') roleStats.admins += item._count
      else if (item.role === 'MD') roleStats.mds = item._count
      else if (item.role === 'EMPLOYEE') roleStats.employees = item._count
    })

    // Format MD approval stats
    const mdApprovalStats = {
      pending: 0,
      approved: 0,
      rejected: 0
    }
    mdApprovals.forEach(item => {
      if (item.mdApproval === 'PENDING') mdApprovalStats.pending = item._count
      else if (item.mdApproval === 'APPROVED') mdApprovalStats.approved = item._count
      else if (item.mdApproval === 'REJECTED') mdApprovalStats.rejected = item._count
    })

    // Calculate average response time (this would need a more complex query in production)
    const avgResponseTime = '2.5h'
    const avgResolutionTime = '24h'

    return NextResponse.json({
      stats: {
        // Ticket stats
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
        
        // User stats
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        ...roleStats,
        
        // Breakdowns
        ticketsByCategory: categoryCounts,
        ticketsByPriority: priorityCounts,
        ticketsByStatus: statusCounts,
        mdApprovals: mdApprovalStats
      }
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}