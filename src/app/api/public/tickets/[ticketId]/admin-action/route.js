import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { sendMDApprovalEmail, sendServiceAssignmentEmail } from '@/app/lib/email' 

export async function POST(request, { params }) {
  try {
    // 1. FIX: Await params in Next.js 15
    const { ticketId } = await params
    const { action, review, status, mdApproval, thirdParty, thirdPartyStatus, thirdPartyDetails, reviewType,assignedToId } = await request.json()

    // Verify admin access
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // 2. FIX: Await token verification (jose returns Promise)
    const decoded = await verifyToken(token)
    if (!decoded || !decoded.id) {
      console.error('Invalid token or missing ID. Decoded:', decoded)
      return NextResponse.json(
        { message: 'Invalid token - missing user ID' },
        { status: 401 }
      )
    }

    // 3. Now decoded.id should be defined
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user || !['ADMIN','EMPLOYEE', 'SUPER_ADMIN'].includes(user.role)) {
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

    // Prepare update data
    const updateData = {}
    if (status) updateData.status = status
    if (mdApproval) updateData.mdApproval = mdApproval
    if (thirdParty !== undefined) updateData.thirdParty = thirdParty
    if (thirdPartyStatus) updateData.thirdPartyStatus = thirdPartyStatus
    if (thirdPartyDetails) updateData.thirdPartyDetails = thirdPartyDetails


     // NEW: Handle ASSIGN_TO_SERVICE action separately because it requires validation and specific status
    if (action === 'ASSIGN_TO_SERVICE') {
       console.log('ASSIGN_TO_SERVICE received. assignedToId:', assignedToId); 
      if (!assignedToId) {
        return NextResponse.json(
          { message: 'assignedToId is required' },
          { status: 400 }
        )
      }

      // Verify that the assigned user exists and is a service team member
      const serviceUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      })

      if (!serviceUser || serviceUser.role !== 'SERVICE_TEAM') {
        console.error('User role is not SERVICE_TEAM:', serviceUser.role);
        return NextResponse.json(
          { message: 'Invalid service team member' },
          { status: 400 }
        )
      }

      // Set assignment and status
      updateData.assignedToId = assignedToId
      updateData.status = 'PENDING_SERVICE_ACCEPTANCE'
    }

    // Update ticket if there are changes
    let updatedTicket = ticket
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

    // Add review
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

    // Add to history
    await prisma.ticketHistory.create({
      data: {
        action: action === 'MESSAGE' ? 'COMMENT_ADDED' : 'ADMIN_ACTION',
        description: review || `Admin action: ${action}`,
        createdById: user.id,
        ticketId
      }
    })

    // Send email if forwarded to MD
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

    // NEW: Send notification to assigned service team member
    if (action === 'ASSIGN_TO_SERVICE' && assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      })
      if (assignedUser) {
        // You need to implement sendServiceAssignmentEmail in your email utility
        await sendServiceAssignmentEmail(
          assignedUser.email,
          ticketId,
          ticket.ticketNumber,
          review
        )
      }
    }


    return NextResponse.json({
      message: 'Action completed successfully',
      ticket: updatedTicket
    })

  } catch (error) {
    console.error('Error in admin action:', error)
    return NextResponse.json(
      { message: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}