// app/api/tickets/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { emitTicketUpdate } from '@/app/lib/socket'
import { sendStatusUpdateEmail } from '@/app/lib/email'

// Fix: params is a Promise that needs to be awaited
export async function GET(request, { params }) {
  try {
    // Await the params to get the actual values
    const { id } = await params
    
    // Log for debugging
    console.log('Fetching ticket with ID:', id)
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      console.log('No token provided')
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = await verifyToken(token) // Make sure verifyToken is async
    if (!decoded || !decoded.id) {
      console.log('Invalid token')
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log('User ID from token:', decoded.id)

    // Get ticket with all relations
    const ticket = await prisma.ticket.findUnique({
      where: { id },
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
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        history: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!ticket) {
      console.log('Ticket not found with ID:', id)
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Get current user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      console.log('User not found with ID:', decoded.id)
      return NextResponse.json(
        { message: 'User not found' },
        { status: 401 }
      )
    }

    console.log('Current user role:', user.role)
    console.log('Ticket created by:', ticket.createdById)
    console.log('Ticket assigned to:', ticket.assignedToId)

    // FIXED: Better permission logic
    const hasAccess = 
      user.role === 'SUPER_ADMIN' || // Super admin can see everything
      user.role === 'MD' || // MD can see everything
      ticket.createdById === user.id || // Creator can see their ticket
      (user.role === 'ADMIN') || // FIXED: Admins can see all tickets
      (user.role === 'ADMIN' && ticket.assignedToId === user.id) // Or just assigned tickets

    console.log('Has access:', hasAccess)

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ ticket })

  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { message: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params // FIX: Await params here too
    const { status, assignedToId, review, mdApproval, thirdParty, thirdPartyStatus, thirdPartyDetails, closedAt } = await request.json()

    // Get token from cookies
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = await verifyToken(token) // Make sure verifyToken is async
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get current user
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
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignedTo: true
      }
    })

    if (!existingTicket) {
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      )
    }

    // FIXED: Better permission logic for updates
    const canEdit = 
      user.role === 'SUPER_ADMIN' || // Super admin can edit anything
      (user.role === 'ADMIN') || // FIXED: Admins can edit all tickets
      (user.role === 'MD' && existingTicket.status === 'PENDING_MD_APPROVAL') || // MD can approve/reject
      (user.role === 'EMPLOYEE' && existingTicket.createdById === user.id && status === 'CLOSED') // Employee can close their own

    if (!canEdit) {
      return NextResponse.json(
        { message: 'You do not have permission to update this ticket' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData = {}
    const historyEntries = []

    if (status && status !== existingTicket.status) {
      updateData.status = status
      historyEntries.push({
        action: 'STATUS_CHANGED',
        description: `Status changed from ${existingTicket.status} to ${status}`,
        oldValue: existingTicket.status,
        newValue: status,
      })
    }

    if (assignedToId && assignedToId !== existingTicket.assignedToId) {
      updateData.assignedToId = assignedToId
      historyEntries.push({
        action: 'ASSIGNED',
        description: `Ticket assigned to user ${assignedToId}`,
        oldValue: existingTicket.assignedToId,
        newValue: assignedToId,
      })
    }

    if (mdApproval !== undefined && mdApproval !== existingTicket.mdApproval) {
      updateData.mdApproval = mdApproval
      if (mdApproval === 'APPROVED') {
        updateData.mdApprovedAt = new Date()
      } else if (mdApproval === 'REJECTED') {
        updateData.mdRejectedAt = new Date()
      }
      historyEntries.push({
        action: 'MD_APPROVAL_UPDATED',
        description: `MD approval status changed to ${mdApproval}`,
        oldValue: existingTicket.mdApproval,
        newValue: mdApproval,
      })
    }

    if (thirdParty !== undefined && thirdParty !== existingTicket.thirdParty) {
      updateData.thirdParty = thirdParty
      historyEntries.push({
        action: 'THIRD_PARTY_UPDATED',
        description: `Third party service ${thirdParty ? 'requested' : 'cancelled'}`,
        oldValue: existingTicket.thirdParty,
        newValue: thirdParty,
      })
    }

    if (thirdPartyStatus !== undefined && thirdPartyStatus !== existingTicket.thirdPartyStatus) {
      updateData.thirdPartyStatus = thirdPartyStatus
      updateData.thirdPartyDetails = thirdPartyDetails || existingTicket.thirdPartyDetails
      historyEntries.push({
        action: 'THIRD_PARTY_STATUS_UPDATED',
        description: `Third party status changed to ${thirdPartyStatus}`,
        oldValue: existingTicket.thirdPartyStatus,
        newValue: thirdPartyStatus,
      })
    }

    if (closedAt) {
      updateData.closedAt = new Date(closedAt)
      historyEntries.push({
        action: 'TICKET_CLOSED',
        description: 'Ticket closed',
      })
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Add review if provided
    if (review) {
      await prisma.review.create({
        data: {
          content: review,
          reviewType: getReviewType(user.role, status, mdApproval),
          createdById: user.id,
          ticketId: id,
        }
      })
    }

    // Create history entries
    for (const entry of historyEntries) {
      await prisma.ticketHistory.create({
        data: {
          ...entry,
          createdById: user.id,
          ticketId: id,
        }
      })
    }

    // Send email notification if status changed
    if (status && status !== existingTicket.status) {
      await sendStatusUpdateEmail(
        existingTicket.createdBy.email,
        existingTicket.ticketNumber,
        status,
        review
      )
    }

    // Emit socket event
    emitTicketUpdate(`ticket-${id}-updated`, updatedTicket)

    return NextResponse.json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    })

  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { message: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}

function getReviewType(role, status, mdApproval) {
  if (mdApproval === 'APPROVED' || mdApproval === 'REJECTED') return 'MD_REVIEW'
  if (role === 'MD') return 'MD_REVIEW'
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'ADMIN_REVIEW'
  if (status === 'CLOSED') return 'STATUS_UPDATE'
  return 'SYSTEM_NOTE'
}  