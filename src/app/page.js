// app/page.js
import { redirect } from 'next/navigation'
import { verifyToken } from './lib/auth'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (token) {
    const user = verifyToken(token)
    if (user) {
      redirect('/dashboard')
    }
  }
  
  redirect('/auth/login')
}