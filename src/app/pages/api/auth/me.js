import { getCurrentUser } from '../../../lib/auth'
import { handleAsyncError } from '../../../utils/errorHandler'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const user = await getCurrentUser(req)

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  res.json({ user })
}

export default handleAsyncError(handler)