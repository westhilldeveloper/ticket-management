import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { getCurrentUser } from '@/app/lib/auth'
import { uploadToCloudinary } from '@/app/lib/cloudinary'
import { sendTicketCreatedEmail } from '@/app/lib/email'
import { emitTicketUpdate } from '@/app/lib/socket'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    // Get current user
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const title = formData.get('title')
    const description = formData.get('description')
    const category = formData.get('category')
    const priority = formData.get('priority') || 'MEDIUM'
    const review = formData.get('review')
    const attachments = formData.getAll('attachments')
    const mainCategory = formData.get('mainCategory')
    const requestServiceType = formData.get('requestServiceType')
    const itemType = formData.get('itemType')

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Handle file uploads
    let attachmentUrls = []
    let attachmentPublicIds = []

    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { message: `File ${file.name} exceeds 5MB limit` },
            { status: 400 }
          )
        }

        const uploadResult = await uploadToCloudinary(file, 'tickets')
        
        if (!uploadResult.success) {
          return NextResponse.json(
            { message: `Failed to upload file: ${file.name}` },
            { status: 500 }
          )
        }
        
        attachmentUrls.push(uploadResult.url)
        attachmentPublicIds.push(uploadResult.publicId)
      }
    }

    // Create ticket in database
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        category,
        priority,
        mainCategory,      // new
        requestServiceType,// new
        itemType,
        attachment: attachmentUrls.join(','),
        attachmentPublicId: attachmentPublicIds.join(','),
        createdById: user.id,
        status: 'OPEN',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
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

    // Find all admins to notify
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' }
        ]
      }
    })

    // Send emails to admins
    const ticketLink = `${process.env.NEXTAUTH_URL}/tickets/${ticket.id}`
    
    for (const admin of admins) {
      await sendTicketCreatedEmail(
        admin.email, 
        ticket.id, 
        ticketNumber, 
        category,
        ticketLink
      )
    }

    // Create notifications for admins
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          type: 'TICKET_CREATED',
          title: 'New Ticket Created',
          message: `New ${category} ticket: ${title}`,
          userId: admin.id,
          ticketId: ticket.id,
        }
      })
    }

    // Emit socket event for real-time updates
    emitTicketUpdate('new-ticket', {
      type: 'NEW_TICKET',
      ticket: {
        ...ticket,
        link: ticketLink
      }
    })

    return NextResponse.json({
      message: 'Ticket created successfully',
      ticket: {
        ...ticket,
        link: ticketLink
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    const departmentParam = searchParams.get('department')
    const allParam = searchParams.get('all') === 'true'

    // Build where clause based on user role
    let where = {}

    if (user.role === 'EMPLOYEE') {
      // Employees can only see their own tickets
      where.createdById = user.id
    } else if (user.role === 'ADMIN') {
      if (allParam) {
        // Admin wants all tickets, no department restriction
        // but still apply other filters
      } else if (departmentParam) {
        // Admin explicitly wants a specific department
        where.createdBy = { department: departmentParam }
      } else if (user.department) {
        // Default: restrict to admin's own department
        where.createdBy = { department: user.department }
      }
      // If no department and not all, then where remains {} (all tickets)
    } else if (user.role === 'MD') {
      // MD can see all tickets (especially those pending approval)
      // where remains {}
    } else if (user.role === 'SUPER_ADMIN') {
      // Super admin can see all tickets
      // where remains {}
    }

    // Apply additional filters
    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (priority) {
      where.priority = priority
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    console.log('User role:', user.role)
    console.log('Where clause:', JSON.stringify(where, null, 2))

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        reviews: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { name: true, role: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const total = await prisma.ticket.count({ where })

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}