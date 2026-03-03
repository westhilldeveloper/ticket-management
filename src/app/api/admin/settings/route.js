import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.id || decoded.userId || decoded.sub
    if (!userId) {
      return NextResponse.json(
        { message: 'Invalid token structure' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch settings from database
    const settings = await prisma.systemSetting.findMany()

    // Convert to object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    // Default settings structure
    const defaultSettings = {
      general: {
        companyName: settingsObject.companyName || 'Westhill International',
        supportEmail: settingsObject.supportEmail || 'support@westhillinternational.com',
        timezone: settingsObject.timezone || 'UTC',
        dateFormat: settingsObject.dateFormat || 'MM/DD/YYYY',
        timeFormat: settingsObject.timeFormat || '12h',
        language: settingsObject.language || 'en'
      },
      ticket: {
        defaultPriority: settingsObject.defaultPriority || 'MEDIUM',
        autoAssignEnabled: settingsObject.autoAssignEnabled === 'true',
        requireMDApproval: settingsObject.requireMDApproval === 'true',
        ticketPrefix: settingsObject.ticketPrefix || 'TKT',
        maxAttachments: parseInt(settingsObject.maxAttachments || '5'),
        maxFileSize: parseInt(settingsObject.maxFileSize || '5'),
        allowedFileTypes: (settingsObject.allowedFileTypes || 'jpg,png,pdf,doc,docx').split(',')
      },
      email: {
        smtpHost: settingsObject.smtpHost || process.env.EMAIL_HOST || '',
        smtpPort: settingsObject.smtpPort || process.env.EMAIL_PORT || '587',
        smtpUser: settingsObject.smtpUser || process.env.EMAIL_USER || '',
        smtpPassword: '',
        fromEmail: settingsObject.fromEmail || process.env.EMAIL_FROM || '',
        enableNotifications: settingsObject.enableNotifications === 'true',
        sendDailyDigest: settingsObject.sendDailyDigest === 'true'
      },
      security: {
        passwordMinLength: parseInt(settingsObject.passwordMinLength || '8'),
        requireSpecialChar: settingsObject.requireSpecialChar === 'true',
        requireNumber: settingsObject.requireNumber === 'true',
        requireUppercase: settingsObject.requireUppercase === 'true',
        sessionTimeout: parseInt(settingsObject.sessionTimeout || '30'),
        maxLoginAttempts: parseInt(settingsObject.maxLoginAttempts || '5'),
        twoFactorAuth: settingsObject.twoFactorAuth === 'true'
      },
      notification: {
        emailNotifications: settingsObject.emailNotifications === 'true',
        ticketCreated: settingsObject.ticketCreated === 'true',
        statusChanged: settingsObject.statusChanged === 'true',
        mdApproval: settingsObject.mdApproval === 'true',
        dailySummary: settingsObject.dailySummary === 'true',
        weeklyReport: settingsObject.weeklyReport === 'true'
      },
      system: {
        maintenanceMode: settingsObject.maintenanceMode === 'true',
        debugMode: settingsObject.debugMode === 'true',
        logLevel: settingsObject.logLevel || 'info',
        backupEnabled: settingsObject.backupEnabled === 'true',
        backupFrequency: settingsObject.backupFrequency || 'daily',
        retentionDays: parseInt(settingsObject.retentionDays || '30')
      }
    }

    return NextResponse.json({ settings: defaultSettings })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}