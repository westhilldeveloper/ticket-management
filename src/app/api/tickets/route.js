import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { getCurrentUser } from '@/app/lib/auth'
import { uploadToCloudinary } from '@/app/lib/cloudinary'
import { sendTicketCreatedEmail } from '@/app/lib/email'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get('title')
    const description = formData.get('description')
    const category = formData.get('category')
    const priority = formData.get('priority') || 'MEDIUM'
    const review = formData.get('review')
    const attachments = formData.getAll('attachments')
    const mainCategoryName = formData.get('mainCategory')      // dynamic category name
    const requestServiceType = formData.get('requestServiceType')
    const itemType = formData.get('itemType')

    if (!title || !description || !category) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Resolve dynamic category ID from name
    let mainCategoryId = null
    if (mainCategoryName) {
      const dynamicCategory = await prisma.dynamicCategory.findFirst({
        where: { name: mainCategoryName }
      })
      if (dynamicCategory) {
        mainCategoryId = dynamicCategory.id
      } else {
        // Optionally create the category? For now, treat as invalid
        return NextResponse.json({ message: `Invalid main category: ${mainCategoryName}` }, { status: 400 })
      }
    }

    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    let attachmentUrls = []
    let attachmentPublicIds = []

    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json({ message: `File ${file.name} exceeds 5MB limit` }, { status: 400 })
        }
        const uploadResult = await uploadToCloudinary(file, 'tickets')
        if (!uploadResult.success) {
          return NextResponse.json({ message: `Failed to upload file: ${file.name}` }, { status: 500 })
        }
        attachmentUrls.push(uploadResult.url)
        attachmentPublicIds.push(uploadResult.publicId)
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        category,
        priority,
        mainCategoryId,              // store relation ID instead of string
        requestServiceType,
        itemType,
        attachment: attachmentUrls.join(','),
        attachmentPublicId: attachmentPublicIds.join(','),
        createdById: user.id,
        status: 'OPEN',
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, department: true } }
      }
    })

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

    await prisma.ticketHistory.create({
      data: {
        action: 'TICKET_CREATED',
        description: `Ticket created by ${user.name}`,
        createdById: user.id,
        ticketId: ticket.id,
      }
    })

    const admins = await prisma.user.findMany({
      where: { OR: [{ role: 'ADMIN' }, { role: 'SUPER_ADMIN' }] }
    })

    const ticketLink = `${process.env.NEXTAUTH_URL}/tickets/${ticket.id}`

    for (const admin of admins) {
      try {
        await sendTicketCreatedEmail(admin.email, ticket.id, ticketNumber, category, ticketLink)
      } catch (emailError) {
        console.error('Email failed but ticket created:', emailError)
      }
    }

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

    return NextResponse.json({
      message: 'Ticket created successfully',
      ticket: { ...ticket, link: ticketLink }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')        // branch filter (still string)
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    const assignedTo = searchParams.get('assignedTo')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const departmentParam = searchParams.get('department')   // optional department name filter

    let where = {}

    // Helper to resolve department name to category ID
    const resolveCategoryId = async (deptName) => {
      if (!deptName) return null
      const cat = await prisma.dynamicCategory.findFirst({ where: { name: deptName } })
      return cat?.id || null
    }

    // Role-based access control (RBAC) with dynamic categories
    if (user.role === 'SUPER_ADMIN') {
      if (departmentParam) {
        const catId = await resolveCategoryId(departmentParam)
        if (catId) where.mainCategoryId = catId
        else return NextResponse.json({ tickets: [], pagination: { page, limit, total: 0, pages: 0 } })
      }
    } 
    else if (user.role === 'MD') {
      // MD sees all, no department filter
    } 
    else if (user.role === 'ADMIN') {
      if (user.department) {
        const catId = await resolveCategoryId(user.department)
        if (catId) where.mainCategoryId = catId
        else return NextResponse.json({ tickets: [], pagination: { page, limit, total: 0, pages: 0 } })
      } else {
        where.mainCategoryId = null // no department -> no tickets
      }
    } 
    else if (user.role === 'SERVICE_TEAM') {
      where.assignedToId = user.id
    } 
    else { // EMPLOYEE or other
      where.createdById = user.id
    }

    // Additional filters (status, category, priority, assignedTo, date range)
    if (status) where.status = status
    if (category) where.category = category
    if (priority) where.priority = priority
    if (assignedTo) where.assignedToId = assignedTo

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          createdBy: { select: { id: true, name: true, email: true, department: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
          reviews: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { name: true, role: true } } }
          },
           mainCategory: { select: { id: true, name: true } }  
        }
      }),
      prisma.ticket.count({ where })
    ])

    return NextResponse.json({
      tickets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })

  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}