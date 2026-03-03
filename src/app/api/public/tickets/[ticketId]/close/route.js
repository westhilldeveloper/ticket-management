import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { sendStatusUpdateEmail } from '@/app/lib/email'
import { emitTicketUpdate } from '@/app/lib/socket'

export async function POST(request, { params }) {
  try {
    // AWAIT params in Next.js 15
    const { ticketId } = await params
    const { review } = await request.json()

    // Verify access
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // AWAIT token verification (jose returns Promise)
    const decoded = await verifyToken(token)
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 401 }
      )
    }

    // Get existing ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true,
        assignedTo: true
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Check if user can close ticket
    const canClose = 
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN' ||
      ticket.createdById === user.id

    if (!canClose) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Add review
    await prisma.review.create({
      data: {
        content: review || 'Ticket closed',
        reviewType: 'STATUS_UPDATE',
        createdById: user.id,
        ticketId
      }
    })

    // Add to history
    await prisma.ticketHistory.create({
      data: {
        action: 'TICKET_CLOSED',
        description: review || 'Ticket closed',
        createdById: user.id,
        ticketId
      }
    })

    // Send email notifications
    const closeMessage = `Ticket #${ticket.ticketNumber} has been closed. ${review ? `Reason: ${review}` : ''}`
    
    await sendStatusUpdateEmail(
      ticket.createdBy.email,
      ticket.ticketNumber,
      'CLOSED',
      closeMessage
    )

    if (ticket.assignedTo) {
      await sendStatusUpdateEmail(
        ticket.assignedTo.email,
        ticket.ticketNumber,
        'CLOSED',
        closeMessage
      )
    }

    // Emit socket update
    emitTicketUpdate(`ticket-${ticketId}-updated`, updatedTicket)

    return NextResponse.json({
      message: 'Ticket closed successfully',
      ticket: updatedTicket
    })

  } catch (error) {
    console.error('Error closing ticket:', error)
    return NextResponse.json(
      { message: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}