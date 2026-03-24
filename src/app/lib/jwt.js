import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET
const secret = new TextEncoder().encode(JWT_SECRET)

export const generateToken = async (user) => {
  console.log('generateToken called for user:', user?.email)
  
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is missing')
      return null
    }
    
    if (!user?.id || !user?.email) {
      console.error('Invalid user object', user)
      return null
    }
    
    const token = await new SignJWT({ 
      id: user.id, 
      email: user.email, 
      role: user.role || 'USER' 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)
    
    return token
  } catch (error) {
    console.error('Error generating token:', error)
    return null
  }
}

export const verifyToken = async (token) => {
  console.log('verifyToken called, token exists:', !!token)
  
  try {
    if (!token) return null
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is missing')
      return null
    }
    
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    console.error('Token verification error:', error.message)
    return null
  }
}