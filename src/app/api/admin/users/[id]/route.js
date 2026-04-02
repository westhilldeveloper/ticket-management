import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function PUT(request, { params }) {
  try {
    const { id } = await params

    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 })

    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const { name, role, department, isActive } = await request.json()
    if (!name || !role) {
      return NextResponse.json({ message: 'Name and role are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, role, department, isActive: isActive !== undefined ? isActive : user.isActive },
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true }
    })

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser })

  } catch (error) {
    console.error('Error updating user:', error)
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

    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    if (currentUser.id === id) {
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 })
    }

    const userToDelete = await prisma.user.findUnique({ where: { id }, include: { createdTickets: true, assignedTickets: true } })
    if (!userToDelete) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    if (userToDelete.createdTickets.length > 0 || userToDelete.assignedTickets.length > 0) {
      return NextResponse.json({
        message: 'Cannot delete user with existing tickets. Reassign or delete tickets first.'
      }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.deleteMany({ where: { createdById: id } })
      await tx.ticketHistory.deleteMany({ where: { createdById: id } })
      await tx.notification.deleteMany({ where: { userId: id } })
      await tx.auditLog.deleteMany({ where: { userId: id } })
      await tx.department.updateMany({ where: { headId: id }, data: { headId: null } })
      await tx.user.update({ where: { id }, data: { memberOfDepartments: { set: [] } } })
      await tx.user.delete({ where: { id } })
    })

    return NextResponse.json({ message: 'User deleted successfully' })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}