import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { emitTicketUpdate } from '@/app/lib/socket'

export async function POST(request, { params }) {
  try {
    const { id } = params
    const { content, reviewType } = await request.json()

    // Get token from cookies
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
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

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id }
    })

    if (!ticket) {
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        content,
        reviewType: reviewType || 'SYSTEM_NOTE',
        createdById: user.id,
        ticketId: id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    // Add to history
    await prisma.ticketHistory.create({
      data: {
        action: 'REVIEW_ADDED',
        description: `${user.name} added a review`,
        createdById: user.id,
        ticketId: id,
      }
    })

    // Emit socket event
    emitTicketUpdate(`ticket-${id}-updated`, {
      ...ticket,
      reviews: [review]
    })

    return NextResponse.json({
      message: 'Review added successfully',
      review
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding review:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}