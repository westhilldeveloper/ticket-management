import { prisma } from '../../../lib/db'
import { handleAsyncError } from '../../../utils/errorHandler'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, otp } = req.body

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  if (user.emailVerified) {
    return res.status(400).json({ message: 'Email already verified' })
  }

  if (user.otp !== otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' })
  }

  // Verify user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      otp: null,
      otpExpiry: null,
    }
  })

  res.json({ message: 'Email verified successfully' })
}

export default handleAsyncError(handler)