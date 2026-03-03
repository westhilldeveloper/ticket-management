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
    console.log('Pending approvals - Decoded token:', decoded)

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

    const tickets = await prisma.ticket.findMany({
      where: {
        status: 'PENDING_MD_APPROVAL'
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviews: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            createdBy: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ tickets })

  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}