import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { verifyToken } from '@/app/lib/auth';

export async function POST(request, { params }) {
  try {
    const { ticketId } = await params;
    const { action, review } = await request.json(); // 'accept' or 'reject'

    // Verify user
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

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });
    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    // Check assignment and status
    if (ticket.assignedToId !== user.id) {
      return NextResponse.json({ message: 'This ticket is not assigned to you' }, { status: 403 });
    }
    if (ticket.status !== 'PENDING_SERVICE_ACCEPTANCE') {
      return NextResponse.json({ message: 'Ticket is not pending your acceptance' }, { status: 400 });
    }

    // Determine new status and review content
    let newStatus;
    let reviewContent;
    if (action === 'accept') {
      newStatus = 'SERVICE_IN_PROGRESS';
      reviewContent = review || 'Accepted by service team';
    } else if (action === 'reject') {
      newStatus = 'SERVICE_REJECTED';
      reviewContent = review || 'Rejected by service team';
      if (!review) {
        return NextResponse.json({ message: 'Rejection reason required' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    // Create review
    await prisma.review.create({
      data: {
        content: reviewContent,
        reviewType: 'SYSTEM_NOTE',
        createdById: user.id,
        ticketId
      }
    });

    // Create history
    await prisma.ticketHistory.create({
      data: {
        action: action === 'accept' ? 'SERVICE_ACCEPTED' : 'SERVICE_REJECTED',
        description: reviewContent,
        createdById: user.id,
        ticketId
      }
    });

    return NextResponse.json({
      message: `Ticket ${action}ed successfully`,
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error in service team response:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}