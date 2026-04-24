import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { verifyToken } from '@/app/lib/auth';
import { getIO } from '@/app/lib/socket'; 
import { emitTicketUpdate } from '@/app/lib/socket';

export async function POST(request, { params }) {
  try {
    const { ticketId } = await params;
    const { action, review } = await request.json();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.role !== 'SERVICE_TEAM') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.assignedToId !== user.id) {
      return NextResponse.json({ message: 'This ticket is not assigned to you' }, { status: 403 });
    }

    if (ticket.status !== 'PENDING_SERVICE_ACCEPTANCE') {
      return NextResponse.json({ message: 'Ticket is not pending your acceptance' }, { status: 400 });
    }

    let newStatus;
    let reviewContent;

    if (action === 'accept') {
      newStatus = 'SERVICE_IN_PROGRESS';
      reviewContent = review || 'Accepted by service team';
    } else if (action === 'reject') {
      if (!review) {
        return NextResponse.json({ message: 'Rejection reason required' }, { status: 400 });
      }
      newStatus = 'REJECTED_BY_SERVICE';
      reviewContent = review;
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus }
    });

    await prisma.review.create({
      data: {
        content: reviewContent,
        reviewType: 'SYSTEM_NOTE',
        createdById: user.id,
        ticketId
      }
    });

    await prisma.ticketHistory.create({
      data: {
        action: action === 'accept' ? 'SERVICE_ACCEPTED' : 'SERVICE_REJECTED',
        description: reviewContent,
        createdById: user.id,
        ticketId
      }
    });

    const finalTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        reviews: {
          include: {
            createdBy: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        history: {
          include: {
            createdBy: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Emit socket events
    const io = getIO();
    if (io) {
      // 1. Emit to the ticket creator (employee)
      io.to(`user:${finalTicket.createdById}`).emit('ticket-updated', finalTicket);
      // 2. Emit to the ticket room (for the detail page)
      io.to(`ticket-${ticketId}`).emit(`ticket-${ticketId}-updated`, finalTicket);
      // 3. Also emit to the assigned service team member (so their dashboard updates instantly)
      if (finalTicket.assignedToId) {
        io.to(`user:${finalTicket.assignedToId}`).emit('ticket-updated', finalTicket);
      }
    }


// if (io && finalTicket.assignedToId) {
//   io.to(`user:${finalTicket.assignedToId}`).emit('new-ticket-assigned', finalTicket);
// }

    return NextResponse.json({
      message: `Ticket ${action}ed successfully`,
      ticket: finalTicket
    });
  } catch (error) {
    console.error('Error in service team response:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}