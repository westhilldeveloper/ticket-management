import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    console.log('Recent activities - Decoded token:', decoded)

    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Try multiple possible ID fields
    const userId = decoded.id || decoded.userId || decoded.sub
    if (!userId) {
      console.error('No user ID found in token. Available keys:', Object.keys(decoded))
      return NextResponse.json(
        { message: 'Invalid token structure' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const history = await prisma.ticketHistory.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        createdBy: {
          select: {
            name: true
          }
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            title: true
          }
        }
      }
    })

    const activities = history.map(item => ({
      id: item.id,
      type: getActivityType(item.action),
      description: item.description || `${item.action} on ticket #${item.ticket?.ticketNumber}`,
      createdAt: item.createdAt,
      user: item.createdBy?.name,
      ticketId: item.ticket?.id,
      ticketNumber: item.ticket?.ticketNumber
    }))

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getActivityType(action) {
  const typeMap = {
    'TICKET_CREATED': 'TICKET_CREATED',
    'STATUS_CHANGED': 'STATUS_CHANGED',
    'ASSIGNED': 'ASSIGNED',
    'REVIEW_ADDED': 'REVIEW_ADDED',
    'MD_APPROVED': 'MD_APPROVED',
    'MD_REJECTED': 'MD_REJECTED',
    'ADMIN_ACTION': 'ADMIN_ACTION',
    'TICKET_CLOSED': 'TICKET_CLOSED'
  }
  return typeMap[action] || 'SYSTEM_UPDATE'
}