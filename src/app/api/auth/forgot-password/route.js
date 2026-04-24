import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { sendOTPEmail } from '@/app/lib/email'

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request) {
  try {
    const { email } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiry,
      }
    })

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp)

    if (!emailResult.success) {
      return NextResponse.json(
        { message: 'Failed to send OTP email', error: emailResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'OTP sent successfully' }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}