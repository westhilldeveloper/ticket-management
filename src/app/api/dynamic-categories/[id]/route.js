import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const category = await prisma.dynamicCategory.findUnique({ where: { id } })
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, sortOrder, isActive } = body

    // Check uniqueness if name is changed
    const existingCategory = await prisma.dynamicCategory.findUnique({ where: { id } })
    if (!existingCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    if (name && name !== existingCategory.name) {
      const nameConflict = await prisma.dynamicCategory.findUnique({
        where: { name: name.trim() }
      })
      if (nameConflict) {
        return NextResponse.json({ message: 'Another category with this name already exists' }, { status: 409 })
      }
    }

    const updated = await prisma.dynamicCategory.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
        sortOrder: sortOrder !== undefined ? sortOrder : existingCategory.sortOrder,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive
      }
    })

    return NextResponse.json({ category: updated, message: 'Category updated successfully' })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Check if any tickets reference this category
    const ticketsUsing = await prisma.ticket.count({
      where: { mainCategoryId: id }
    })
    if (ticketsUsing > 0) {
      return NextResponse.json({
        message: `Cannot delete category: ${ticketsUsing} ticket(s) are using it. Update or reassign those tickets first.`
      }, { status: 409 })
    }

    await prisma.dynamicCategory.delete({ where: { id } })
    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}