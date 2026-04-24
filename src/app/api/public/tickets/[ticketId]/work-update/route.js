import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { sendStatusUpdateEmail } from '@/app/lib/email'
import { emitTicketUpdate } from '@/app/lib/socket'

export async function POST(request, { params }) {
  try {
    // AWAIT params in Next.js 15
    const { ticketId } = await params
    const { workType, details, status } = await request.json()

    // Verify admin access
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

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get existing ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Add review
    await prisma.review.create({
      data: {
        content: details,
        reviewType: 'STATUS_UPDATE',
        createdById: user.id,
        ticketId
      }
    })

    // Add to history
    await prisma.ticketHistory.create({
      data: {
        action: workType,
        description: details,
        createdById: user.id,
        ticketId
      }
    })

    // Send email to creator
    await sendStatusUpdateEmail(
      ticket.createdBy.email,
      ticket.ticketNumber,
      status,
      details
    )

    // Emit socket update
    emitTicketUpdate(ticketId, updatedTicket, ticket.createdBy.id)

    return NextResponse.json({
      message: 'Work update recorded',
      ticket: updatedTicket
    })

  } catch (error) {
    console.error('Error in work update:', error)
    return NextResponse.json(
      { message: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}