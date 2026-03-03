// app/lib/auth.js
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET
// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET)

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10)
}

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

export const generateToken = async (user) => {
  console.log('generateToken called for user:', user?.email)
  
  try {
    if (!JWT_SECRET) {
      console.error('Cannot generate token: JWT_SECRET is missing')
      return null
    }
    
    if (!user || !user.id || !user.email) {
      console.error('Cannot generate token: Invalid user object', user)
      return null
    }
    
    // Create token using jose
    const token = await new SignJWT({ 
      id: user.id, 
      email: user.email, 
      role: user.role || 'USER' 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)
    
    console.log('Token generated successfully')
    return token
  } catch (error) {
    console.error('Error generating token:', error)
    return null
  }
}

export const verifyToken = async (token) => {
  console.log('verifyToken called, token exists:', !!token)
  
  try {
    if (!token) {
      console.log('No token to verify')
      return null
    }
    
    if (!JWT_SECRET) {
      console.error('Cannot verify token: JWT_SECRET is missing')
      return null
    }
    
    // Verify token using jose
    const { payload } = await jwtVerify(token, secret)
    console.log('Token verified for user:', payload?.email)
    return payload
  } catch (error) {
    console.error('Token verification error:', error.message)
    return null
  }
}

// Remove old cookie functions as we use Next.js built-in methods now

export const getCurrentUser = async (token) => {
  try {
    if (!token) return null
    
    const decoded = await verifyToken(token)
    if (!decoded) return null
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true
      }
    })
    
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}