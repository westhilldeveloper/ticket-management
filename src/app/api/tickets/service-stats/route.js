// app/api/tickets/service-stats/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/app/lib/auth'
import { startOfMonth, endOfMonth } from 'date-fns'

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

    // Only SERVICE_TEAM and SUPER_ADMIN can access this
    if (user.role !== 'SERVICE_TEAM' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    // If user is SUPER_ADMIN, they might want stats for a specific user? For simplicity, we return stats for the current user.
    // If you need stats for any user, you could add a query param, but we'll keep it as is.
    const userId = user.id

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Get all tickets assigned to this user (excluding those that were rejected maybe? We'll include all assigned to get totals)
    const assignedTickets = await prisma.ticket.findMany({
      where: {
        assignedToId: userId,
        // Optionally exclude tickets that were rejected? We'll include them for completeness.
      },
      select: {
        id: true,
        status: true,
        category: true,
        priority: true,
        createdAt: true,
        closedAt: true,
        updatedAt: true
      }
    })

    // Counts for current statuses
    const pendingAcceptance = assignedTickets.filter(t => t.status === 'PENDING_SERVICE_ACCEPTANCE').length
    const inProgress = assignedTickets.filter(t => t.status === 'SERVICE_IN_PROGRESS').length
    const resolved = assignedTickets.filter(t => t.status === 'SERVICE_RESOLVED').length

    // Resolved this month (using closedAt if available, otherwise updatedAt)
    const resolvedThisMonth = assignedTickets.filter(t => {
      if (t.status !== 'SERVICE_RESOLVED') return false
      const date = t.closedAt || t.updatedAt
      return date >= monthStart && date <= monthEnd
    }).length

    // Total tickets assigned (excluding those that might be rejected? We'll count all)
    const totalAssigned = assignedTickets.length

    // Average completion time for resolved tickets (from createdAt to resolvedAt)
    const resolvedTickets = assignedTickets.filter(t => t.status === 'SERVICE_RESOLVED' && t.closedAt)
    const completionTimes = resolvedTickets.map(t => {
      const diffMs = new Date(t.closedAt) - new Date(t.createdAt)
      return diffMs / (1000 * 60 * 60) // hours
    }).filter(time => time > 0)

    const avgCompletionTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0

    // By category: total assigned and resolved
    const categories = ['HR', 'IT', 'TECHNICAL']
    const byCategory = {}
    categories.forEach(cat => {
      const ticketsInCat = assignedTickets.filter(t => t.category === cat)
      byCategory[cat] = {
        total: ticketsInCat.length,
        resolved: ticketsInCat.filter(t => t.status === 'SERVICE_RESOLVED').length
      }
    })

    // By priority: total assigned and resolved
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const byPriority = {}
    priorities.forEach(pri => {
      const ticketsInPri = assignedTickets.filter(t => t.priority === pri)
      byPriority[pri] = {
        total: ticketsInPri.length,
        resolved: ticketsInPri.filter(t => t.status === 'SERVICE_RESOLVED').length
      }
    })

    const stats = {
      pendingAcceptance,
      inProgress,
      resolvedThisMonth,
      totalResolved: resolved,
      averageCompletionTime: avgCompletionTime > 0 ? `${avgCompletionTime}h` : 'N/A',
      byCategory,
      byPriority
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching service team stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}