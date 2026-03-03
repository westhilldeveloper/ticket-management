// app/api/tickets/md-history/route.js
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

    // Only MD and SUPER_ADMIN can access this
    if (user.role !== 'MD' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mdApproval = searchParams.get('mdApproval') // 'APPROVED' or 'REJECTED'
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'desc'

    const tickets = await prisma.ticket.findMany({
      where: {
        mdApproval: mdApproval
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
        ...(mdApproval === 'APPROVED' ? { mdApprovedAt: sort } : { mdRejectedAt: sort })
      },
      take: limit
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Error fetching MD history:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}