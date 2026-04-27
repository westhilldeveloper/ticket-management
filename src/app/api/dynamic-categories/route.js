import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || !['ADMIN', 'SUPER_ADMIN','EMPLOYEE','MD'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const isActiveFilter = includeInactive ? {} : { isActive: true }

    const categories = await prisma.dynamicCategory.findMany({
      where: isActiveFilter,
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching dynamic categories:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, sortOrder, isActive = true } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 })
    }

    // Check if name already exists
    const existing = await prisma.dynamicCategory.findUnique({
      where: { name: name.trim() }
    })
    if (existing) {
      return NextResponse.json({ message: 'Category with this name already exists' }, { status: 409 })
    }

    const category = await prisma.dynamicCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        sortOrder: sortOrder ?? 0,
        isActive
      }
    })

    return NextResponse.json({ category, message: 'Category created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating dynamic category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}