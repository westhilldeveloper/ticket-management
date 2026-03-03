import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete all settings
    await prisma.systemSetting.deleteMany()

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'SETTINGS_RESET',
        entityType: 'SYSTEM',
        userId: user.id,
        details: JSON.stringify({ action: 'Reset to defaults' })
      }
    })

    // Return default settings
    const defaultSettings = {
      general: {
        companyName: 'Westhill International',
        supportEmail: 'support@westhillinternational.com',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        language: 'en'
      },
      ticket: {
        defaultPriority: 'MEDIUM',
        autoAssignEnabled: true,
        requireMDApproval: true,
        ticketPrefix: 'TKT',
        maxAttachments: 5,
        maxFileSize: 5,
        allowedFileTypes: ['jpg', 'png', 'pdf', 'doc', 'docx']
      },
      email: {
        smtpHost: process.env.EMAIL_HOST || '',
        smtpPort: process.env.EMAIL_PORT || '587',
        smtpUser: process.env.EMAIL_USER || '',
        smtpPassword: '',
        fromEmail: process.env.EMAIL_FROM || '',
        enableNotifications: true,
        sendDailyDigest: true
      },
      security: {
        passwordMinLength: 8,
        requireSpecialChar: true,
        requireNumber: true,
        requireUppercase: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        twoFactorAuth: false
      },
      notification: {
        emailNotifications: true,
        ticketCreated: true,
        statusChanged: true,
        mdApproval: true,
        dailySummary: false,
        weeklyReport: true
      },
      system: {
        maintenanceMode: false,
        debugMode: false,
        logLevel: 'info',
        backupEnabled: true,
        backupFrequency: 'daily',
        retentionDays: 30
      }
    }

    return NextResponse.json({
      message: 'Settings reset to default',
      settings: defaultSettings
    })

  } catch (error) {
    console.error('Error resetting settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}