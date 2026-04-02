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
 const allowedDomains = ['@westhillinternational.com', '@finovestgroup.com']
    // Validate email domain (company email)
   if (!allowedDomains.some(domain => email.endsWith(domain))) {
      return NextResponse.json(
        { message: 'Only company email addresses (@westhillinternational.com or @finovestgroup.com) are allowed' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      )
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
        branch,
        otp,
        otpExpiry,
        role: 'SUPER_ADMIN', // Default role
      }
    })

    // Send OTP email
    await sendOTPEmail(email, otp)

    return NextResponse.json(
      { 
        message: 'User created successfully. Please verify your email with OTP.',
        userId: user.id 
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


// const { PrismaClient } = require('@prisma/client')
// const bcrypt = require('bcryptjs')

// const prisma = new PrismaClient()

// const hashPassword = async (password) => {
//   return await bcrypt.hash(password, 10)
// }

// async function createAdminUser() {
//   try {
//     console.log('=== ADMIN USER CREATION ===')
    
//     const email = 'sarathlalsh@gmail.com'
//     const password = 'Sarathlal879@!'
//     const name = 'sarathAdmin'
//     const department = 'IT'
//     const role = 'ADMIN' // Can be 'ADMIN' or 'SUPER_ADMIN'

//     console.log('Creating admin user with:')
//     console.log({ email, name, department, role })

//     // Check if user already exists
//     const existingUser = await prisma.user.findUnique({
//       where: { email }
//     })

//     if (existingUser) {
//       console.log('⚠️ User already exists. Updating to admin role...')
      
//       // Hash the password (in case you want to update it)
//       const hashedPassword = await hashPassword(password)
      
//       // Update existing user to admin
//       const updatedUser = await prisma.user.update({
//         where: { email },
//         data: {
//           password: hashedPassword,
//           name: name,
//           role: role,
//           department: department,
//           isActive: true,
//           // Since your signup route uses OTP, we'll mark as verified
//           otp: null,
//           otpExpiry: null,
//           emailVerified: true // Add this if you have this field
//         }
//       })
      
//       console.log('✅ User updated successfully:')
//       console.log({
//         id: updatedUser.id,
//         email: updatedUser.email,
//         name: updatedUser.name,
//         role: updatedUser.role,
//         department: updatedUser.department,
//         isActive: updatedUser.isActive
//       })
//     } else {
//       console.log('Creating new admin user...')
      
//       // Hash the password
//       const hashedPassword = await hashPassword(password)
      
//       // Create new admin user
//       const newUser = await prisma.user.create({
//         data: {
//           email,
//           password: hashedPassword,
//           name,
//           role,
//           department,
//           isActive: true,
//           // Since this is an admin created via script, mark as verified
//           otp: null,
//           otpExpiry: null,
//           emailVerified: true // Add this if you have this field
//         }
//       })
      
//       console.log('✅ Admin user created successfully:')
//       console.log({
//         id: newUser.id,
//         email: newUser.email,
//         name: newUser.name,
//         role: newUser.role,
//         department: newUser.department,
//         isActive: newUser.isActive
//       })
//     }

//     // Verify the user can login
//     const verifyUser = await prisma.user.findUnique({
//       where: { email },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         role: true,
//         department: true,
//         isActive: true,
//         password: true
//       }
//     })
    
//     // Test password comparison
//     const testPassword = await bcrypt.compare(password, verifyUser.password)
//     if (testPassword) {
//       console.log('✅ Password verification successful - user can login')
//     } else {
//       console.log('❌ Password verification failed')
//     }

//     console.log('\n=== ADMIN USER SUMMARY ===')
//     console.log('Email:', email)
//     console.log('Password:', password)
//     console.log('Role:', role)
//     console.log('Department:', department)
//     console.log('Status: Active')
//     console.log('\nYou can now login with these credentials.')

//   } catch (error) {
//     console.error('❌ Error creating admin user:')
//     console.error(error)
//   } finally {
//     await prisma.$disconnect()
//   }
// }

// // Run the function
// createAdminUser()