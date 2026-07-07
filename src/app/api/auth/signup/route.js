import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { hashPassword } from '@/app/lib/auth'
import { sendOTPEmail } from '@/app/lib/email'

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request) {
  try {
    const { email, password, name, department, branch } = await request.json()

    // 1. Domain validation
    const allowedDomains = ['@westhillinternational.com', '@finovestgroup.com']
    if (!allowedDomains.some(domain => email.endsWith(domain))) {
      return NextResponse.json(
        { message: 'Only company email addresses (@westhillinternational.com or @finovestgroup.com) are allowed' },
        { status: 400 }
      )
    }

    // 2. Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    // 3. If user exists and is already verified → reject
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { message: 'Email already registered and verified' },
        { status: 400 }
      )
    }

    // 4. If user exists but is NOT verified → update OTP and resend
    if (existingUser && !existingUser.emailVerified) {
      const newOtp = generateOTP()
      const newOtpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          otp: newOtp,
          otpExpiry: newOtpExpiry,
          // Optionally update profile fields if the user changed them
          name,
          department,
          branch,
          // If password changed, update it as well
          password: password ? await hashPassword(password) : existingUser.password,
        }
      })

      await sendOTPEmail(email, newOtp)

      return NextResponse.json(
        {
          message: 'OTP resent. Please verify your email.',
          userId: existingUser.id
        },
        { status: 200 }
      )
    }

    // 5. New user → create unverified account
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    const hashedPassword = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        department,
        branch,
        role: 'EMPLOYEE', // default
        otp,
        otpExpiry,
        emailVerified: false, // explicit
        isActive: true,
      }
    })

    await sendOTPEmail(email, otp)

    return NextResponse.json(
      {
        message: 'User created. Please verify your email with OTP.',
        userId: newUser.id
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}