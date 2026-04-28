import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { emitTicketUpdate } from '@/app/lib/socket'

export async function POST(request, { params }) {
  try {
    const { id } = await params

    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const decoded = await verifyToken(token)
    const userId = decoded.id || decoded.userId || decoded.sub
    if (!userId) return NextResponse.json({ message: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    // Only allow admins or super admins to redirect
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { targetDepartment, assignedToId, reason } = body

    // Validate targetDepartment
    const validDepartments = ['IT', 'ADMIN', 'HR']
    if (!targetDepartment || !validDepartments.includes(targetDepartment)) {
      return NextResponse.json({ message: 'Invalid target department' }, { status: 400 })
    }

    // 🔁 Get or create the DynamicCategory by name
    let category = await prisma.dynamicCategory.findUnique({
      where: { name: targetDepartment }
    })
    if (!category) {
      category = await prisma.dynamicCategory.create({
        data: { name: targetDepartment }
      })
    }

    // Check if assignedToId belongs to that department (if provided)
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId, department: targetDepartment }
      })
      if (!assignee) {
        return NextResponse.json({ message: 'Assigned user not in target department' }, { status: 400 })
      }
    }

    // Get the existing ticket
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      include: { createdBy: true, mainCategory: true }
    })

    if (!existingTicket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 })
    }

    // Prepare update data – use the foreign key field
    const updateData = {
      mainCategoryId: category.id,   // ✅ set the foreign key
      updatedAt: new Date()
    }
    if (assignedToId) {
      updateData.assignedToId = assignedToId
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    })

    // Add to history
    await prisma.ticketHistory.create({
      data: {
        action: 'TICKET_REDIRECTED',
        description: `Ticket redirected from ${existingTicket.mainCategory?.name || 'unknown'} to ${targetDepartment}${reason ? `: ${reason}` : ''}`,
        oldValue: existingTicket.mainCategory?.name,
        newValue: targetDepartment,
        createdById: user.id,
        ticketId: id
      }
    })

    // Add a review (optional)
    if (reason) {
      await prisma.review.create({
        data: {
          content: `Ticket redirected to ${targetDepartment} department. Reason: ${reason}`,
          reviewType: 'ADMIN_REVIEW',
          createdById: user.id,
          ticketId: id
        }
      })
    }

    // Notify the new department's admins
    const departmentAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        department: targetDepartment
      }
    })

    for (const admin of departmentAdmins) {
      await prisma.notification.create({
        data: {
          type: 'TICKET_UPDATED',
          title: 'Ticket Redirected',
          message: `Ticket #${updatedTicket.ticketNumber} has been redirected to your department`,
          userId: admin.id,
          ticketId: id
        }
      })
    }

    // Notify the original creator
    await prisma.notification.create({
      data: {
        type: 'TICKET_UPDATED',
        title: 'Ticket Redirected',
        message: `Your ticket #${updatedTicket.ticketNumber} has been redirected to the ${targetDepartment} department.`,
        userId: existingTicket.createdById,
        ticketId: id
      }
    })

    // Emit socket event for real-time updates
    emitTicketUpdate(`ticket-${id}-updated`, updatedTicket)

    return NextResponse.json({
      message: 'Ticket redirected successfully',
      ticket: updatedTicket
    })

  } catch (error) {
    console.error('Error redirecting ticket:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}