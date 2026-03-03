import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { sendMDApprovalEmail } from '@/app/lib/email'

export async function POST(request, { params }) {
  try {
    // 1. FIX: Await params in Next.js 15
    const { ticketId } = await params
    const { action, review, status, mdApproval, thirdParty, thirdPartyStatus, thirdPartyDetails, reviewType } = await request.json()

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