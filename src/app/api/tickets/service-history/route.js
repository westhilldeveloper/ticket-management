// app/api/tickets/service-history/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/app/lib/auth'

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

    // Only SERVICE_TEAM and SUPER_ADMIN can access this endpoint
    if (user.role !== 'SERVICE_TEAM' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'desc'

    // For SUPER_ADMIN, optionally allow viewing another user's history via a userId query param
    let targetUserId = user.id
    if (user.role === 'SUPER_ADMIN') {
      const requestedUserId = searchParams.get('userId')
      if (requestedUserId) {
        // Verify that the requested user exists and is a service team member
        const targetUser = await prisma.user.findUnique({
          where: { id: requestedUserId },
          select: { role: true }
        })
        if (targetUser && targetUser.role === 'SERVICE_TEAM') {
          targetUserId = requestedUserId
        }
        // If user not found or not service team, fallback to current user (or could return error)
      }
    }

    // Fetch resolved tickets assigned to the target service team member
    const tickets = await prisma.ticket.findMany({
      where: {
        assignedToId: targetUserId,
        status: 'SERVICE_RESOLVED'
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            department: true
          }
        }
      },
      orderBy: {
        closedAt: sort // resolved tickets should have closedAt set
      },
      take: limit
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Error fetching service team history:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}