import { prisma } from '../../../lib/db'
import { hashPassword } from '../../../lib/auth'
import { handleAsyncError } from '../../../utils/errorHandler'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, otp, newPassword } = req.body

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  if (user.otp !== otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' })
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
    }
  })

  res.json({ message: 'Password reset successfully' })
}

export default handleAsyncError(handler)