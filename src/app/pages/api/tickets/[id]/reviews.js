import { prisma } from '../../../../lib/db'
import { getCurrentUser } from '../../../../lib/auth'
import { emitTicketUpdate } from '../../../../lib/socket'
import { handleAsyncError, AppError } from '../../../../utils/errorHandler'

async function handler(req, res) {
  const user = await getCurrentUser(req)
  
  if (!user) {
    throw new AppError('Not authenticated', 401)
  }

  const { id } = req.query

  switch (req.method) {
    case 'POST':
      return addReview(req, res, user, id)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function addReview(req, res, user, ticketId) {
  const { content, reviewType } = req.body

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId }
  })

  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  const review = await prisma.review.create({
    data: {
      content,
      reviewType,
      createdById: user.id,
      ticketId,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, role: true }
      }
    }
  })

  // Add to history
  await prisma.ticketHistory.create({
    data: {
      action: 'REVIEW_ADDED',
      description: `${user.name} added a review: ${content.substring(0, 50)}...`,
      createdById: user.id,
      ticketId,
    }
  })

  // Emit socket event
  emitTicketUpdate(ticketId, {
    type: 'REVIEW_ADDED',
    review,
    message: 'New review added'
  })

  res.status(201).json({
    message: 'Review added successfully',
    review
  })
}

export default handleAsyncError(handler)