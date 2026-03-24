import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { verifyToken } from '@/app/lib/auth';

export async function POST(request, { params }) {
  try {
    const { ticketId } = await params;
    const { workType, details } = await request.json(); // 'progress' or 'resolve'

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
    if (ticket.status !== 'SERVICE_IN_PROGRESS') {
      return NextResponse.json({ message: 'Ticket must be in progress to add work' }, { status: 400 });
    }

    // Prepare update data for resolve action
    let updatedTicket;
    if (workType === 'resolve') {
      updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'SERVICE_RESOLVED' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      });
    } else {
      // For progress, just fetch the current ticket (updatedAt will auto-update)
      updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      });
    }

    // Create review
    await prisma.review.create({
      data: {
        content: details,
        reviewType: workType === 'resolve' ? 'STATUS_UPDATE' : 'SYSTEM_NOTE',
        createdById: user.id,
        ticketId
      }
    });

    // Create history
    await prisma.ticketHistory.create({
      data: {
        action: workType === 'resolve' ? 'SERVICE_RESOLVED' : 'SERVICE_PROGRESS',
        description: details,
        createdById: user.id,
        ticketId
      }
    });

    return NextResponse.json({
      message: workType === 'resolve' ? 'Ticket marked as resolved' : 'Progress note added',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error in service work update:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}