// app/api/auth/logout/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
  const response = NextResponse.json({ message: 'Logged out successfully' })
  
  // Clear the cookie
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  })
  
  return response
}