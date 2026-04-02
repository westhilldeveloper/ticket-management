import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const { isActive } = await request.json()

    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 })

    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    await prisma.user.update({ where: { id }, data: { isActive } })

    return NextResponse.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` })

  } catch (error) {
    console.error('Error toggling user status:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}