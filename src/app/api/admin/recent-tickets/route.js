import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 })

    const userId = decoded.id || decoded.userId || decoded.sub
    if (!userId) return NextResponse.json({ message: 'Invalid token structure' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const departmentParam = searchParams.get('department')
    const requestServiceType = searchParams.get('requestServiceType')  // correct placement
 
    let where = {}
    if (user.role === 'ADMIN') {
      if (departmentParam && departmentParam !== user.department) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 })
      }
      if (user.department) {
        where.mainCategory = { name: user.department }
      }
    } else if (user.role === 'SUPER_ADMIN' && departmentParam) {
      where.mainCategory = departmentParam
    }
    if (requestServiceType) {
      where.requestServiceType = requestServiceType
    }

    const tickets = await prisma.ticket.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true, department: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ tickets })

  } catch (error) {
    console.error('Error fetching recent tickets:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
} 