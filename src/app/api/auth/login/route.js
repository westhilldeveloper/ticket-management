// app/api/auth/login/route.js
import { NextResponse } from 'next/server'
import { comparePassword, generateToken } from '@/app/lib/auth'
import { prisma } from '@/app/lib/db'

export async function POST(request) {
  console.log('=== LOGIN API CALLED ===')
  
  try {
    const { email, password } = await request.json()
    console.log('Login attempt for email:', email)

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    console.log('Looking up user in database...')
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('User not found:', email)
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }
    console.log('User found:', { id: user.id, email: user.email, role: user.role })

    // Check if user is active
    if (user.isActive === false) {
      console.log('User is inactive:', email)
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Verify password
    console.log('Comparing passwords...')
    const isValid = await comparePassword(password, user.password)
    console.log('Password valid:', isValid)
    
    if (!isValid) {
      console.log('Invalid password for:', email)
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    console.log('Generating token...')
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)
    
    const token = await generateToken(user)
    console.log('Token generated:', token ? 'Yes (length: ' + token.length + ')' : 'No')

    if (!token) {
      console.error('Failed to generate token')
      return NextResponse.json(
        { message: 'Error generating authentication token' },
        { status: 500 }
      )
    }

    console.log('Login successful for:', email)

    // Create response with user data (exclude password)
    const { password: _, ...userWithoutPassword } = user
    
    const response = NextResponse.json({
      user: userWithoutPassword,
      message: 'Login successful'
    })

    // Set cookie using Next.js built-in method
    console.log('Setting cookie...')
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    console.log('Cookie set, returning response')
    return response
    
  } catch (error) {
    console.error('=== LOGIN ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json(
      { message: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}