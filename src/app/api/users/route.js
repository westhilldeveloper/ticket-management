import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {prisma} from '../../lib/db'
import { getCurrentUser } from '../../lib/auth'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    const currentUser = await getCurrentUser(token)

    if (!currentUser) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Only admins can fetch all users
    if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    // Build where clause
    let where = {}
    
    if (active === 'true') {
      where.isActive = true
    }

    if (role) {
      where.role = role  // filter by exact role (e.g., 'SERVICE_TEAM')
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      },
      take: Math.min(limit, 100) // Max 100 users
    })

    return NextResponse.json({
      users,
      total: users.length
    })

  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}