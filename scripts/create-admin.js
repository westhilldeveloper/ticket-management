const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = 'admin@westhillinternational.com'  // Change as needed
    const password = 'YourStrongPassword123!'        // Use a strong password
    const name = 'Admin User'
    const department = 'IT'
    const role = 'SUPER_ADMIN'                        // or ADMIN

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if user already exists (just in case)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      console.log('User already exists.')
      return
    }

    // Create user – directly in DB, skipping OTP
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        department,
        role,
        isActive: true,
        emailVerified: true,  // Important: no OTP needed
        otp: null,
        otpExpiry: null,
      }
    })

    console.log('Admin user created:', user.email, user.role)
  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()