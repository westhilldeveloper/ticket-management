import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { cookies } from 'next/headers'

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true }
    })

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Ticket ID required' }, { status: 400 })
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { ticketNumber: true, title: true }
    })
    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 })
    }

    // Delete in transaction (cascade handled by Prisma relations)
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { ticketId: id } }),
      prisma.review.deleteMany({ where: { ticketId: id } }),
      prisma.ticketHistory.deleteMany({ where: { ticketId: id } }),
      prisma.ticket.delete({ where: { id } })
    ])

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: `Ticket deleted: ${ticket.ticketNumber} - ${ticket.title}`,
        entityType: 'Ticket',
        entityId: id,
        userId: currentUser.id,
        details: { ticketNumber: ticket.ticketNumber, title: ticket.title },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ message: 'Ticket deleted successfully' })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}