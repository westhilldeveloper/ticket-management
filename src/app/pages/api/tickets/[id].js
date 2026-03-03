import { prisma } from '../../../lib/db'
import { getCurrentUser } from '../../../lib/auth'
import { sendStatusUpdateEmail, sendMDApprovalEmail } from '../../../lib/email'
import { emitTicketUpdate } from '../../../lib/socket'
import { handleAsyncError, AppError } from '../../../utils/errorHandler'

async function handler(req, res) {
  const user = await getCurrentUser(req)
  
  if (!user) {
    throw new AppError('Not authenticated', 401)
  }

  const { id } = req.query

  switch (req.method) {
    case 'GET':
      return getTicket(req, res, user, id)
    case 'PUT':
      return updateTicket(req, res, user, id)
    case 'DELETE':
      return deleteTicket(req, res, user, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getTicket(req, res, user, ticketId) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, department: true }
      },
      assignedTo: {
        select: { id: true, name: true, email: true, role: true }
      },
      reviews: {
        include: {
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      history: {
        include: {
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  // Check permissions
  if (user.role === 'EMPLOYEE' && ticket.createdById !== user.id) {
    throw new AppError('You do not have permission to view this ticket', 403)
  }

  res.json({ ticket })
}

async function updateTicket(req, res, user, ticketId) {
  const { status, assignedToId, review, mdApproval, thirdParty, thirdPartyStatus } = req.body

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      createdBy: true,
      assignedTo: true
    }
  })

  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  // Check permissions
  if (user.role === 'EMPLOYEE' && ticket.createdById !== user.id) {
    throw new AppError('You do not have permission to update this ticket', 403)
  }

  // Prepare update data
  const updateData = {}
  const historyEntries = []

  if (status && status !== ticket.status) {
    updateData.status = status
    historyEntries.push({
      action: 'STATUS_CHANGED',
      description: `Status changed from ${ticket.status} to ${status}`,
      oldValue: ticket.status,
      newValue: status,
    })
  }

  if (assignedToId && assignedToId !== ticket.assignedToId) {
    updateData.assignedToId = assignedToId
    historyEntries.push({
      action: 'ASSIGNED',
      description: `Ticket assigned to user ${assignedToId}`,
      oldValue: ticket.assignedToId,
      newValue: assignedToId,
    })
  }

  if (mdApproval !== undefined && mdApproval !== ticket.mdApproval) {
    updateData.mdApproval = mdApproval
    historyEntries.push({
      action: 'MD_APPROVAL_UPDATED',
      description: `MD approval status changed to ${mdApproval}`,
      oldValue: ticket.mdApproval,
      newValue: mdApproval,
    })
  }

  if (thirdParty !== undefined && thirdParty !== ticket.thirdParty) {
    updateData.thirdParty = thirdParty
    historyEntries.push({
      action: 'THIRD_PARTY_UPDATED',
      description: `Third party status changed to ${thirdParty}`,
      oldValue: ticket.thirdParty,
      newValue: thirdParty,
    })
  }

  if (thirdPartyStatus !== undefined && thirdPartyStatus !== ticket.thirdPartyStatus) {
    updateData.thirdPartyStatus = thirdPartyStatus
    historyEntries.push({
      action: 'THIRD_PARTY_STATUS_UPDATED',
      description: `Third party status changed to ${thirdPartyStatus}`,
      oldValue: ticket.thirdPartyStatus,
      newValue: thirdPartyStatus,
    })
  }

  // Add review if provided
  if (review) {
    await prisma.review.create({
      data: {
        content: review,
        reviewType: getReviewTypeFromStatus(status, mdApproval),
        createdById: user.id,
        ticketId: ticket.id,
      }
    })
  }

  // Update ticket
  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: updateData,
    include: {
      createdBy: true,
      assignedTo: true
    }
  })

  // Create history entries
  for (const entry of historyEntries) {
    await prisma.ticketHistory.create({
      data: {
        ...entry,
        createdById: user.id,
        ticketId: ticket.id,
      }
    })
  }

  // Send emails based on status changes
  if (status) {
    // Notify employee
    await sendStatusUpdateEmail(
      ticket.createdBy.email,
      ticket.ticketNumber,
      status,
      review
    )

    // If pending MD approval, notify MDs
    if (status === 'PENDING_MD_APPROVAL') {
      const mds = await prisma.user.findMany({
        where: { role: 'MD' }
      })
      
      for (const md of mds) {
        await sendMDApprovalEmail(
          md.email,
          ticket.id,
          ticket.ticketNumber,
          review
        )
      }
    }

    // If approved/rejected by MD, notify admin
    if (status === 'APPROVED_BY_MD' || status === 'REJECTED_BY_MD') {
      if (ticket.assignedTo) {
        await sendStatusUpdateEmail(
          ticket.assignedTo.email,
          ticket.ticketNumber,
          status,
          review
        )
      }
    }
  }

  // Emit socket event
  emitTicketUpdate(ticket.id, {
    type: 'TICKET_UPDATED',
    ticket: updatedTicket,
    message: `Ticket status updated to ${status || 'new state'}`
  })

  res.json({
    message: 'Ticket updated successfully',
    ticket: updatedTicket
  })
}

function getReviewTypeFromStatus(status, mdApproval) {
  if (mdApproval === 'APPROVED') return 'MD_REVIEW'
  if (mdApproval === 'REJECTED') return 'MD_REVIEW'
  if (status === 'PENDING_MD_APPROVAL') return 'ADMIN_REVIEW'
  if (status === 'CLOSED' || status === 'RESOLVED') return 'STATUS_UPDATE'
  return 'ADMIN_REVIEW'
}

async function deleteTicket(req, res, user, ticketId) {
  // Only SUPER_ADMIN can delete tickets
  if (user.role !== 'SUPER_ADMIN') {
    throw new AppError('You do not have permission to delete tickets', 403)
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId }
  })

  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  // Delete related records first
  await prisma.review.deleteMany({
    where: { ticketId }
  })

  await prisma.ticketHistory.deleteMany({
    where: { ticketId }
  })

  // Delete ticket
  await prisma.ticket.delete({
    where: { id: ticketId }
  })

  // Emit socket event
  emitTicketUpdate(ticketId, {
    type: 'TICKET_DELETED',
    ticketId,
    message: 'Ticket deleted'
  })

  res.json({ message: 'Ticket deleted successfully' })
}

export default handleAsyncError(handler)