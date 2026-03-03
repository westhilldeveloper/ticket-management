import { prisma } from '../../../lib/db'
import { sendOTPEmail } from '../../../lib/email'
import { handleAsyncError } from '../../../utils/errorHandler'

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email } = req.body

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Generate OTP
  const otp = generateOTP()
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiry,
    }
  })

  // Send OTP email
  await sendOTPEmail(email, otp)

  res.json({ message: 'OTP sent successfully' })
}

export default handleAsyncError(handler)