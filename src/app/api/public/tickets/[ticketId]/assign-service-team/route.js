//D:\ticket-management\src\app\api\public\tickets\[ticketId]\assign-service-team\route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { verifyToken } from '@/app/lib/auth';
import { sendServiceAssignmentEmail } from '@/app/lib/email';
import { emitTicketUpdate } from '@/app/lib/socket';
import { getIO } from '@/app/lib/socket';

export async function POST(request, { params }) {
  try {
    const { ticketId } = await params;
    const { assignedToId, review } = await request.json();

    // Verify admin
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Validate assignedToId
    if (!assignedToId) {
      return NextResponse.json({ message: 'assignedToId is required' }, { status: 400 });
    }

    const serviceUser = await prisma.user.findUnique({
      where: { id: assignedToId }
    });

    if (!serviceUser || serviceUser.role !== 'SERVICE_TEAM') {
      return NextResponse.json({ message: 'Invalid service team member' }, { status: 400 });
    }

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { createdBy: true }
    });

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        status: 'PENDING_SERVICE_ACCEPTANCE'
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    

    // Create review
    if (review) {
      await prisma.review.create({
        data: {
          content: review,
          reviewType: 'ADMIN_REVIEW',
          createdById: admin.id,
          ticketId
        }
      });
    }

    // Create history
    await prisma.ticketHistory.create({
      data: {
        action: 'ASSIGNED_TO_SERVICE_TEAM',
        description: `Assigned to ${serviceUser.name} with instructions: ${review || 'No instructions'}`,
        createdById: admin.id,
        ticketId
      }
    });

    // Send email
    if (serviceUser.email) {
      await sendServiceAssignmentEmail(
        serviceUser.email,
        ticketId,
        ticket.ticketNumber,
        review
      );
    }

    // Socket emit
    const finalTicket = await prisma.ticket.findUnique({
  where: { id: ticketId },
  include: {
    createdBy: { select: { id: true, name: true, email: true } },
    assignedTo: { select: { id: true, name: true, email: true } },
    reviews: true,
    history: true
  }
});

// emitTicketUpdate(ticketId, finalTicket, finalTicket.createdBy.id);
const io = getIO();
if (io) {
  // Emit to the ticket room (keeps detail pages in sync)
  io.to(`ticket-${ticketId}`).emit(`ticket-${ticketId}-updated`, finalTicket);
  // Emit globally for all dashboards and lists
  // io.emit('ticket-updated', finalTicket);
 
  io.to(`user:${finalTicket.createdById}`).emit('ticket-updated', finalTicket);
}
else{
  console.log("missing io")
}

return NextResponse.json({
  message: 'Ticket assigned to service team',
  ticket: finalTicket
});

  } catch (error) {
    console.error('Error assigning to service team:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}