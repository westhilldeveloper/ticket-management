const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Explicitly pass the DATABASE_URL from environment
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function createAdmin() {
  try {
    const email = 'admin@westhillinternational.com';
    const password = 'Finovest@879';
    const name = 'Admin User';
    const department = 'IT';
    const role = 'SUPER_ADMIN';

    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('User already exists.');
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        department,
        role,
        isActive: true,
        emailVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    console.log('Admin user created:', user.email, user.role);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();