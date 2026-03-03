import { removeAuthCookie } from '../../../lib/auth'
import { handleAsyncError } from '../../../utils/errorHandler'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  removeAuthCookie(res)

  res.json({ message: 'Logged out successfully' })
}

export default handleAsyncError(handler)