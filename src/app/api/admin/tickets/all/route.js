import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken, comparePassword } from '@/app/lib/auth'
import { cookies } from 'next/headers'

export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    // Fetch user including password field
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, password: true } // IMPORTANT: include password
    })

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Parse request body to get password
    let password = null
    try {
      const body = await request.json()
      password = body?.password
    } catch (err) {
      return NextResponse.json({ message: 'Password is required' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json({ message: 'Password is required' }, { status: 400 })
    }

    // Verify password
    const isValid = await comparePassword(password, currentUser.password)
    if (!isValid) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          action: 'Failed bulk delete – incorrect password',
          entityType: 'System',
          userId: currentUser.id,
          details: { error: 'Invalid password' },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })
      return NextResponse.json({ message: 'Incorrect password' }, { status: 401 })
    }

    // Count tickets
    const ticketCount = await prisma.ticket.count()
    if (ticketCount === 0) {
      return NextResponse.json({ message: 'No tickets to delete' }, { status: 400 })
    }

    // Delete all related records and tickets
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { ticketId: { not: undefined } } }),
      prisma.review.deleteMany({ where: { ticketId: { not: undefined } } }),
      prisma.ticketHistory.deleteMany({ where: { ticketId: { not: undefined } } }),
      prisma.ticket.deleteMany()
    ])

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: `All tickets deleted (${ticketCount} tickets)`,
        entityType: 'System',
        userId: currentUser.id,
        details: { count: ticketCount },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      message: `Successfully deleted ${ticketCount} tickets`,
      count: ticketCount
    })
  } catch (error) {
    console.error('Error deleting all tickets:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}