// scripts/create-admin.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('Starting admin user creation...')
    
    const email = 'hr@westhillinternational.com'
    const password = 'Sarathlal879@!'
    const name = 'westhillMD'
    const department = 'MD'
    const role = 'MD' // or 'SUPER_ADMIN' if you want super admin

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('User already exists with this email. Updating to admin...')
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name: name,
          role: role,
          department: department,
          isActive: true
        }
      })
      
      console.log('✅ User updated successfully:')
      console.log({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department
      })
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // Create new admin user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          department,
          isActive: true
        }
      })
      
      console.log('✅ Admin user created successfully:')
      console.log({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department
      })
    }

    // Verify the user can login by testing password comparison
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    const testPassword = await bcrypt.compare(password, user.password)
    if (testPassword) {
      console.log('✅ Password verification successful')
    } else {
      console.log('❌ Password verification failed')
    }

  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()