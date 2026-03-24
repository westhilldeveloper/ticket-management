import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error: error.message }
  }
}

export const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Email Verification</h2>
      <p>Your OTP for email verification is:</p>
      <h1 style="color: #1e3a8a; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `
  
  return await sendEmail({
    to: email,
    subject: 'Verify Your Email - Ticket Management System',
    html,
  })
}

export const sendTicketCreatedEmail = async (email, ticketId, ticketNumber, category) => {
  const ticketLink = `${process.env.NEXTAUTH_URL}/send-ticket/${ticketId}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Ticket Created</h2>
      <p>A new ${category} ticket has been created.</p>
      <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
      <p><strong>Status:</strong> Open</p>
      <p>Click the button below to view and manage this ticket:</p>
      <a href="${ticketLink}" 
         style="display: inline-block; background-color: #2563eb; color: white; 
                padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                margin-top: 20px;">
        View Ticket
      </a>
      <p style="margin-top: 20px;">Or copy this link: ${ticketLink}</p>
    </div>
  `
  
  return await sendEmail({
    to: email,
    subject: `New Ticket Created: ${ticketNumber}`,
    html,
  })
}

export const sendMDApprovalEmail = async (email, ticketId, ticketNumber, review) => {
  const ticketLink = `${process.env.NEXTAUTH_URL}/send-ticket/${ticketId}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">MD Approval Required</h2>
      <p>A ticket requires your approval.</p>
      <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
      <p><strong>Admin Review:</strong> ${review}</p>
      <p>Click the button below to review and approve/reject:</p>
      <a href="${ticketLink}" 
         style="display: inline-block; background-color: #2563eb; color: white; 
                padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                margin-top: 20px;">
        Review Ticket
      </a>
    </div>
  `
  
  return await sendEmail({
    to: email,
    subject: `MD Approval Required: ${ticketNumber}`,
    html,
  })
}

// NEW: Service Team Assignment Email
export const sendServiceAssignmentEmail = async (email, ticketId, ticketNumber, instructions) => {
  const ticketLink = `${process.env.NEXTAUTH_URL}/dashboard/service-team`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Ticket Assignment</h2>
      <p>You have been assigned a ticket by the admin.</p>
      <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
      ${instructions ? `<p><strong>Instructions:</strong> ${instructions}</p>` : ''}
      <p>Please review and accept or reject this assignment.</p>
      <a href="${ticketLink}" 
         style="display: inline-block; background-color: #2563eb; color: white; 
                padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                margin-top: 20px;">
        View Ticket
      </a>
    </div>
  `
  
  return await sendEmail({
    to: email,
    subject: `New Ticket Assignment: ${ticketNumber}`,
    html,
  })
}


export const sendStatusUpdateEmail = async (email, ticketNumber, status, review) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Ticket Status Updated</h2>
      <p>Your ticket status has been updated.</p>
      <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
      <p><strong>New Status:</strong> ${status}</p>
      ${review ? `<p><strong>Review:</strong> ${review}</p>` : ''}
    </div>
  `
  
  return await sendEmail({
    to: email,
    subject: `Ticket Status Updated: ${ticketNumber}`,
    html,
  })
}