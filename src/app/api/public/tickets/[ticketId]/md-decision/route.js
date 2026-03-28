import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { sendStatusUpdateEmail } from '@/app/lib/email'
import { emitTicketUpdate } from '@/app/lib/socket'

export async function POST(request, { params }) {
  try {
    // AWAIT params in Next.js 15
    const { ticketId } = await params
    const body = await request.json()
    const { approved, status, mdApprovalComment, mdRejectReason } = body

    // Verify MD access
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

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

    if (!user || user.role !== 'MD') {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
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

    // Build update data
    const updateData = {
      status,
      mdApproval: approved ? 'APPROVED' : 'REJECTED'
    }

    if (approved) {
      updateData.mdApprovedAt = new Date()
      if (mdApprovalComment) {
        updateData.mdApprovalComment = mdApprovalComment
      }
    } else {
      updateData.mdRejectedAt = new Date()
      updateData.mdRejectReason = mdRejectReason // required; frontend already validates
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Determine review content (use comment or reason)
    const reviewContent = approved
      ? (mdApprovalComment || 'Approved by MD')
      : (mdRejectReason || 'Rejected by MD')

    // Add review
    await prisma.review.create({
      data: {
        content: reviewContent,
        reviewType: 'MD_REVIEW',
        createdById: user.id,
        ticketId
      }
    })

    // Add to history
    await prisma.ticketHistory.create({
      data: {
        action: approved ? 'MD_APPROVED' : 'MD_REJECTED',
        description: `Ticket ${approved ? 'approved' : 'rejected'} by MD: ${reviewContent}`,
        createdById: user.id,
        ticketId
      }
    })

    // Send email to creator
    await sendStatusUpdateEmail(
      ticket.createdBy.email,
      ticket.ticketNumber,
      status,
      reviewContent
    )

    // Send email to assigned admin if any
    if (ticket.assignedTo) {
      await sendStatusUpdateEmail(
        ticket.assignedTo.email,
        ticket.ticketNumber,
        status,
        reviewContent
      )
    }

    // Emit socket update
    emitTicketUpdate(`ticket-${ticketId}-updated`, updatedTicket)

    return NextResponse.json({
      message: approved ? 'Ticket approved' : 'Ticket rejected',
      ticket: updatedTicket
    })

  } catch (error) {
    console.error('Error in MD decision:', error)
    return NextResponse.json(
      { message: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}