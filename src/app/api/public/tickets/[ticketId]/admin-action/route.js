import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { sendMDApprovalEmail, sendServiceAssignmentEmail } from '@/app/lib/email'
import { emitTicketUpdate } from '@/app/lib/socket'
import { getIO } from '@/app/lib/socket'

export async function POST(request, { params }) {
  try {
    const { ticketId } = await params
    const {
      action,
      review,
      status,
      mdApproval,
      thirdParty,
      thirdPartyStatus,
      thirdPartyDetails,
      reviewType,
      assignedToId
    } = await request.json()

    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded?.id) {
      return NextResponse.json({ message: 'Invalid token - missing user ID' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    // admin route -> keep only admin roles
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true,
        assignedTo: true
      }
    })

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 })
    }

    const updateData = {}
    if (status) updateData.status = status
    if (mdApproval) updateData.mdApproval = mdApproval
    if (thirdParty !== undefined) updateData.thirdParty = thirdParty
    if (thirdPartyStatus) updateData.thirdPartyStatus = thirdPartyStatus
    if (thirdPartyDetails) updateData.thirdPartyDetails = thirdPartyDetails

    if (action === 'ASSIGN_TO_SERVICE') {
      if (!assignedToId) {
        return NextResponse.json({ message: 'assignedToId is required' }, { status: 400 })
      }

      const serviceUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      })

      if (!serviceUser || serviceUser.role !== 'SERVICE_TEAM') {
        return NextResponse.json({ message: 'Invalid service team member' }, { status: 400 })
      }

      updateData.assignedToId = assignedToId
      updateData.status = 'PENDING_SERVICE_ACCEPTANCE'
    }

    let updatedTicket = ticket

    // update first
    if (Object.keys(updateData).length > 0) {
      updatedTicket = await prisma.ticket.update({
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
    }

    if (review) {
      await prisma.review.create({
        data: {
          content: review,
          reviewType: reviewType || 'ADMIN_REVIEW',
          createdById: user.id,
          ticketId
        }
      })
    }

    await prisma.ticketHistory.create({
      data: {
        action: action === 'MESSAGE' ? 'COMMENT_ADDED' : 'ADMIN_ACTION',
        description: review || `Admin action: ${action}`,
        createdById: user.id,
        ticketId
      }
    })

    if (action === 'FORWARD_TO_MD') {
      const mds = await prisma.user.findMany({
        where: { role: 'MD', isActive: true }
      })

      for (const md of mds) {
        await sendMDApprovalEmail(
          md.email,
          ticketId,
          ticket.ticketNumber,
          review
        )
      }
    }

    if (action === 'ASSIGN_TO_SERVICE' && assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      })

      if (assignedUser?.email) {
        await sendServiceAssignmentEmail(
          assignedUser.email,
          ticketId,
          ticket.ticketNumber,
          review
        )
      }
    }

    // refetch final ticket after review/history are saved
    const finalTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        reviews: {
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        history: {
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    const io = getIO()
    if (io && finalTicket) {
      console.log(`Emitting ticket-updated to user:${finalTicket.createdById}`)
      io.to(`user:${finalTicket.createdById}`).emit('ticket-updated', finalTicket)
      emitTicketUpdate(ticketId, finalTicket, finalTicket.createdById)
    } else {
      console.warn('Socket.IO not available – skipping real-time emission')
    }

    return NextResponse.json({
      message: 'Action completed successfully',
      ticket: finalTicket
    })
  } catch (error) {
    console.error('Error in admin action:', error)
    return NextResponse.json(
      { message: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}