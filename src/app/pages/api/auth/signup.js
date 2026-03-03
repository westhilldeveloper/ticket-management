import { prisma } from '../../../lib/db'
import { hashPassword } from '../../../lib/auth'
import { sendOTPEmail } from '../../../lib/email'
import { handleAsyncError } from '../../../utils/errorHandler'
import crypto from 'crypto'

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password, name, department } = req.body

  // Validate email domain (company email)
  if (!email.endsWith('@westhillinternational.com')) {
    return res.status(400).json({ 
      message: 'Only company email addresses are allowed' 
    })
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' })
  }

  // Generate OTP
  const otp = generateOTP()
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user (not verified yet)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      department,
      otp,
      otpExpiry,
    }
  })

  // Send OTP email
  await sendOTPEmail(email, otp)

  res.status(201).json({ 
    message: 'User created successfully. Please verify your email with OTP.' 
  })
}

export default handleAsyncError(handler)