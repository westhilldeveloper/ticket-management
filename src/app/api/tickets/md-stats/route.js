// app/api/tickets/md-stats/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/app/lib/auth'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

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

    // Only MD and SUPER_ADMIN can access this
    if (user.role !== 'MD' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // Get all tickets with MD approval
    const allTickets = await prisma.ticket.findMany({
      where: {
        mdApproval: {
          not: null
        }
      },
      select: {
        id: true,
        mdApproval: true,
        category: true,
        priority: true,
        mdApprovedAt: true,
        mdRejectedAt: true,
        createdAt: true
      }
    })

    // Calculate stats
    const total = allTickets.length
    const approved = allTickets.filter(t => t.mdApproval === 'APPROVED').length
    const rejected = allTickets.filter(t => t.mdApproval === 'REJECTED').length
    const pending = await prisma.ticket.count({
      where: { status: 'PENDING_MD_APPROVAL' }
    })

    // This month's stats
    const approvedThisMonth = allTickets.filter(t => 
      t.mdApproval === 'APPROVED' && 
      t.mdApprovedAt && 
      t.mdApprovedAt >= monthStart && 
      t.mdApprovedAt <= monthEnd
    ).length

    const rejectedThisMonth = allTickets.filter(t => 
      t.mdApproval === 'REJECTED' && 
      t.mdRejectedAt && 
      t.mdRejectedAt >= monthStart && 
      t.mdRejectedAt <= monthEnd
    ).length

    // Approval rate
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

    // By category
    const byCategory = {
      HR: { total: 0, approved: 0, rejected: 0 },
      IT: { total: 0, approved: 0, rejected: 0 },
      TECHNICAL: { total: 0, approved: 0, rejected: 0 }
    }

    allTickets.forEach(ticket => {
      const category = ticket.category
      if (byCategory[category]) {
        byCategory[category].total++
        if (ticket.mdApproval === 'APPROVED') byCategory[category].approved++
        if (ticket.mdApproval === 'REJECTED') byCategory[category].rejected++
      }
    })

    // By priority
    const byPriority = {
      LOW: { total: 0, approved: 0, rejected: 0 },
      MEDIUM: { total: 0, approved: 0, rejected: 0 },
      HIGH: { total: 0, approved: 0, rejected: 0 },
      CRITICAL: { total: 0, approved: 0, rejected: 0 }
    }

    allTickets.forEach(ticket => {
      const priority = ticket.priority
      if (byPriority[priority]) {
        byPriority[priority].total++
        if (ticket.mdApproval === 'APPROVED') byPriority[priority].approved++
        if (ticket.mdApproval === 'REJECTED') byPriority[priority].rejected++
      }
    })

    // Average response time (simplified - you might need more complex logic)
    const responseTimes = allTickets
      .filter(t => t.mdApprovedAt || t.mdRejectedAt)
      .map(t => {
        const decisionTime = t.mdApprovedAt || t.mdRejectedAt
        const responseTime = (new Date(decisionTime) - new Date(t.createdAt)) / (1000 * 60 * 60) // in hours
        return responseTime
      })
      .filter(time => time > 0)

    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
      : 0

    const stats = {
      total,
      pending,
      approved,
      rejected,
      approvedThisMonth,
      rejectedThisMonth,
      approvalRate,
      averageResponseTime: avgResponseTime > 0 ? `${avgResponseTime}h` : 'N/A',
      byCategory,
      byPriority
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching MD stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}