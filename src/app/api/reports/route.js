// app/api/reports/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { verifyToken } from '@/app/lib/auth';
import { format, differenceInDays, differenceInHours } from 'date-fns';

export async function GET(request) {
  try {
    // Authentication & Role Check
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'MD'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const category = url.searchParams.get('category');
    const priority = url.searchParams.get('priority');
    const status = url.searchParams.get('status');

    // Build where clause
    let where = {};
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (category && category !== 'ALL') where.category = category;
    if (priority && priority !== 'ALL') where.priority = priority;
    if (status && status !== 'ALL') where.status = status;

    // For MD: only show tickets that are pending MD approval or already approved/rejected by MD
    if (user.role === 'MD') {
      where.OR = [
        { mdApproval: 'PENDING' },
        { mdApproval: 'APPROVED' },
        { mdApproval: 'REJECTED' }
      ];
    }

    // Fetch tickets with necessary relations
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: { select: { name: true, email: true, department: true } },
        assignedTo: { select: { name: true } },
        reviews: { take: 1, orderBy: { createdAt: 'asc' } } // first review for initial response time (optional)
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute duration for each ticket
    const enrichedTickets = tickets.map(ticket => {
      let duration = null;
      let durationText = 'In progress';
      const endDate = ticket.closedAt || (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? ticket.updatedAt : null);
      if (ticket.createdAt && endDate) {
        const days = differenceInDays(new Date(endDate), new Date(ticket.createdAt));
        const hours = differenceInHours(new Date(endDate), new Date(ticket.createdAt)) % 24;
        durationText = `${days}d ${hours}h`;
        duration = { days, hours };
      }
      return {
        ...ticket,
        durationText,
        duration
      };
    });

    // Summary statistics
    const summary = {
      total: enrichedTickets.length,
      open: enrichedTickets.filter(t => t.status === 'OPEN').length,
      pendingMD: enrichedTickets.filter(t => t.status === 'PENDING_MD_APPROVAL').length,
      inProgress: enrichedTickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'SERVICE_IN_PROGRESS').length,
      resolved: enrichedTickets.filter(t => t.status === 'RESOLVED' || t.status === 'SERVICE_RESOLVED').length,
      closed: enrichedTickets.filter(t => t.status === 'CLOSED').length,
      avgResolutionTime: null
    };

    // Calculate average resolution time (days) for resolved/closed tickets
    const resolvedClosed = enrichedTickets.filter(t => t.duration && (t.status === 'RESOLVED' || t.status === 'CLOSED' || t.status === 'SERVICE_RESOLVED'));
    if (resolvedClosed.length > 0) {
      const totalDays = resolvedClosed.reduce((sum, t) => sum + (t.duration.days + t.duration.hours / 24), 0);
      summary.avgResolutionTime = (totalDays / resolvedClosed.length).toFixed(1);
    }

    return NextResponse.json({
      summary,
      tickets: enrichedTickets,
      filters: { startDate, endDate, category, priority, status }
    });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}