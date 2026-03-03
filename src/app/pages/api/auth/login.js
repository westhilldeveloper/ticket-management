import { prisma } from '../../../lib/db'
import { comparePassword, generateToken, setAuthCookie } from '../../../lib/auth'
import { handleAsyncError } from '../../../utils/errorHandler'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  if (!user.emailVerified) {
    return res.status(401).json({ message: 'Please verify your email first' })
  }

  if (!user.isActive) {
    return res.status(401).json({ message: 'Account is deactivated' })
  }

  const isValidPassword = await comparePassword(password, user.password)

  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = generateToken(user)
  setAuthCookie(res, token)

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    }
  })
}

export default handleAsyncError(handler)