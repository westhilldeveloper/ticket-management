import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken, hashPassword } from '@/app/lib/auth'
import { sendPasswordResetEmail } from '@/app/lib/email'

// Helper to generate random password
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request, { params }) {
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

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    const newPassword = generateRandomPassword(12)
    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({ where: { id }, data: { password: hashedPassword } })

    await sendPasswordResetEmail(user.email, newPassword)

    return NextResponse.json({ message: 'Password reset email sent' })

  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}