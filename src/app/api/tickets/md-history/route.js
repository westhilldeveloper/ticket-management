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

    if (!user || (user.role !== 'MD' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let mdApproval = searchParams.get('mdApproval') // 'APPROVED' or 'REJECTED'
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const sort = searchParams.get('sort') || 'desc'

    if (mdApproval) mdApproval = mdApproval.toUpperCase()
    if (mdApproval !== 'APPROVED' && mdApproval !== 'REJECTED') {
      mdApproval = 'APPROVED'
    }

    // Fallback: also include tickets where status matches the equivalent value
    const statusMap = {
      APPROVED: 'APPROVED_BY_MD',
      REJECTED: 'REJECTED_BY_MD'
    }

    const where = {
      OR: [
        { mdApproval: mdApproval },          // uses MDFeedback enum
        { status: statusMap[mdApproval] }    // uses Status enum (fallback)
      ]
    }

    // Order by the appropriate date (or fallback to updatedAt)
    const orderBy = mdApproval === 'APPROVED'
      ? [{ mdApprovedAt: sort }, { updatedAt: 'desc' }]
      : [{ mdRejectedAt: sort }, { updatedAt: 'desc' }]

    const skip = (page - 1) * limit
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          createdBy: {
            select: { name: true, email: true, department: true }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.ticket.count({ where })
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('MD history error:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}