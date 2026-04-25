// app/api/reports/detailed/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { verifyToken } from '@/app/lib/auth';
import { differenceInSeconds } from 'date-fns';

function formatDuration(seconds) {


  if (!seconds) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
  return parts.join(' ') || '<1m';
}

function getDurationColor(seconds) {
  const days = seconds / 86400;
  if (days < 2) return 'green';
  if (days < 7) return 'yellow';
  return 'red';
}

export async function GET(request) {

    

  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    const decoded = await verifyToken(token);
    if (!decoded?.id) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !['SUPER_ADMIN', 'MD'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied – insufficient privileges' }, { status: 403 });
    }

    // Parse filters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const category = url.searchParams.get('category');
    const statusFilter = url.searchParams.get('status');

    let where = {};
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (category && category !== 'ALL') where.category = category;
    if (statusFilter && statusFilter !== 'ALL') where.status = statusFilter;
    if (user.role === 'MD') {
      where.OR = [
        { mdApproval: 'PENDING' },
        { mdApproval: 'APPROVED' },
        { mdApproval: 'REJECTED' }
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        history: {
          include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        reviews: {
          include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const result = tickets.map(ticket => {
      // Combine history and reviews into a single timeline of events
      const events = [
        {
          description: `Ticket created by ${ticket.createdBy?.name || 'Unknown'} (${ticket.createdBy?.role || '?'})`,
          type: 'CREATION',
          user: ticket.createdBy,
          createdAt: ticket.createdAt
        }
      ];
      
      // Add review events
      for (const review of ticket.reviews) {
        events.push({
          description: review.content,
          type: review.reviewType,
          user: review.createdBy,
          createdAt: review.createdAt
        });
      }
      
      // Add history events (excluding ones that duplicate reviews? We'll keep both for full detail)
      for (const history of ticket.history) {
        events.push({
          description: history.description || history.action,
          type: 'HISTORY',
          user: history.createdBy,
          createdAt: history.createdAt
        });
      }
      
      // Sort all events by time
      events.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Add final event (current state if not closed/resolved)
      const endTime = ticket.closedAt || (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED' ? ticket.updatedAt : now);
      events.push({
        description: `Current status: ${ticket.status}`,
        type: 'CURRENT',
        user: null,
        createdAt: endTime
      });
      
      // Compute durations between consecutive events
      const timeline = [];
      for (let i = 0; i < events.length - 1; i++) {
        const start = new Date(events[i].createdAt);
        const end = new Date(events[i+1].createdAt);
        const seconds = differenceInSeconds(end, start);
        if (seconds <= 0) continue;
        timeline.push({
          event: events[i].description,
          type: events[i].type,
          user: events[i].user ? {
            name: events[i].user.name,
            email: events[i].user.email,
            role: events[i].user.role
          } : null,
          start: events[i].createdAt,
          end: events[i+1].createdAt,
          durationSeconds: seconds,
          durationFormatted: formatDuration(seconds),
          color: getDurationColor(seconds)
        });
      }
      
      // Overall duration
      const overallSeconds = differenceInSeconds(endTime, new Date(ticket.createdAt));
      const overallColor = getDurationColor(overallSeconds);
      
      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
        closedAt: ticket.closedAt,
        createdBy: ticket.createdBy?.name,
        createdByEmail: ticket.createdBy?.email,
        assignedTo: ticket.assignedTo?.name,
        overallDuration: formatDuration(overallSeconds),
        overallColor,
        timeline
      };
    });
    
    const summary = {
      total: result.length,
      open: result.filter(t => t.status === 'OPEN').length,
      pendingMD: result.filter(t => t.status === 'PENDING_MD_APPROVAL').length,
      inProgress: result.filter(t => ['IN_PROGRESS', 'SERVICE_IN_PROGRESS'].includes(t.status)).length,
      resolvedClosed: result.filter(t => ['RESOLVED', 'SERVICE_RESOLVED', 'CLOSED'].includes(t.status)).length,
    };
    
    return NextResponse.json({ summary, tickets: result });
  } catch (error) {
    console.error('Detailed report error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}