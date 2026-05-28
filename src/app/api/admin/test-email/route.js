// src/app/api/admin/test-email/route.js
import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import { cookies } from 'next/headers'
import nodemailer from 'nodemailer'

export async function POST(request) {
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

    // Role check – only ADMIN/SUPER_ADMIN can test email
    const { prisma } = await import('@/app/lib/db')
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { role: true, email: true }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail } = await request.json()

    // Validate required fields
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !fromEmail) {
      return NextResponse.json(
        { message: 'Missing SMTP configuration. Please fill all fields.' },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === '465', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    // Send test email to the current user's email
    await transporter.sendMail({
      from: fromEmail,
      to: user.email,
      subject: 'Test Email from Ticket Management System',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify your SMTP configuration.</p>
        <p>If you received this, your email settings are correct.</p>
        <hr />
        <p><strong>Configuration used:</strong></p>
        <ul>
          <li>Host: ${smtpHost}</li>
          <li>Port: ${smtpPort}</li>
          <li>User: ${smtpUser}</li>
          <li>From: ${fromEmail}</li>
        </ul>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `,
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'Test email sent',
        entityType: 'System',
        userId: user.id,
        details: { to: user.email },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ message: 'Test email sent successfully' })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}