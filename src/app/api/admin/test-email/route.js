import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import { sendEmail } from '@/app/lib/email'
import nodemailer from 'nodemailer'

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

    const emailConfig = await request.json()

    // Create test transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    // Verify connection
    await transporter.verify()

    // Send test email
    const info = await transporter.sendMail({
      from: emailConfig.fromEmail || emailConfig.smtpUser,
      to: decoded.email,
      subject: 'Test Email from Ticket Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Configuration Test</h1>
            </div>
            <div class="content">
              <h2 class="success">✓ Test Successful!</h2>
              <p>Your email configuration is working correctly.</p>
              <p><strong>Configuration details:</strong></p>
              <ul>
                <li>Host: ${emailConfig.smtpHost}</li>
                <li>Port: ${emailConfig.smtpPort}</li>
                <li>User: ${emailConfig.smtpUser}</li>
                <li>From: ${emailConfig.fromEmail || emailConfig.smtpUser}</li>
              </ul>
              <p>This is a test email from your Ticket Management System.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    return NextResponse.json({
      message: 'Test email sent successfully',
      messageId: info.messageId
    })

  } catch (error) {
    console.error('Error testing email:', error)
    return NextResponse.json(
      { message: 'Email test failed: ' + error.message },
      { status: 500 }
    )
  }
}