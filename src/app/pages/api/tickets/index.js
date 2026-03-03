import { prisma } from '../../../lib/db'
import { getCurrentUser } from '../../../lib/auth'
import { uploadToCloudinary } from '../../../lib/cloudinary'
import { sendTicketCreatedEmail, sendMDApprovalEmail } from '../../../lib/email'
import { emitTicketUpdate } from '../../../lib/socket'
import { handleAsyncError, AppError } from '../../../utils/errorHandler'
import { v4 as uuidv4 } from 'uuid'

async function handler(req, res) {
  const user = await getCurrentUser(req)
  
  if (!user) {
    throw new AppError('Not authenticated', 401)
  }

  switch (req.method) {
    case 'GET':
      return getTickets(req, res, user)
    case 'POST':
      return createTicket(req, res, user)
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getTickets(req, res, user) {
  const { status, category, page = 1, limit = 10 } = req.query
  
  const skip = (page - 1) * limit
  
  let where = {}
  
  // Filter based on user role
  if (user.role === 'EMPLOYEE') {
    where.createdById = user.id
  } else if (user.role === 'ADMIN') {
    where.OR = [
      { createdById: user.id },
      { assignedToId: user.id },
    ]
  }
  // SUPER_ADMIN and MD can see all tickets
  
  if (status) {
    where.status = status
  }
  
  if (category) {
    where.category = category
  }
  
  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, department: true }
      },
      assignedTo: {
        select: { id: true, name: true, email: true }
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
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: parseInt(limit),
  })
  
  const total = await prisma.ticket.count({ where })
  
  res.json({
    tickets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  })
}

async function createTicket(req, res, user) {
  const { title, description, category, priority, review } = req.body
  let attachment = null

  // Handle file upload if present
  if (req.files?.attachment) {
    const file = req.files.attachment
    const uploadResult = await uploadToCloudinary(file)
    
    if (!uploadResult.success) {
      throw new AppError('Failed to upload file', 500)
    }
    
    attachment = uploadResult.url
  }

  // Generate unique ticket number
  const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Create ticket
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      title,
      description,
      category,
      priority,
      attachment,
      createdById: user.id,
      status: 'OPEN',
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  // Add initial review if provided
  if (review) {
    await prisma.review.create({
      data: {
        content: review,
        reviewType: 'TICKET_CREATION',
        createdById: user.id,
        ticketId: ticket.id,
      }
    })
  }

  // Add to history
  await prisma.ticketHistory.create({
    data: {
      action: 'TICKET_CREATED',
      description: `Ticket created by ${user.name}`,
      createdById: user.id,
      ticketId: ticket.id,
    }
  })

  // Send email to admin (find all admins)
  const admins = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'ADMIN' },
        { role: 'SUPER_ADMIN' }
      ]
    }
  })

  // Send emails to admins
  for (const admin of admins) {
    await sendTicketCreatedEmail(admin.email, ticket.id, ticketNumber, category)
  }

  // Emit socket event
  emitTicketUpdate(ticket.id, {
    type: 'NEW_TICKET',
    ticket,
    message: 'New ticket created'
  })

  res.status(201).json({
    message: 'Ticket created successfully',
    ticket: {
      ...ticket,
      link: `${process.env.NEXTAUTH_URL}/send-ticket/${ticket.id}`
    }
  })
}

export default handleAsyncError(handler)

export const config = {
  api: {
    bodyParser: false, // Disable body parser for file upload
  },
}