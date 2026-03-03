// src/middleware.js
import { NextResponse } from 'next/server'
import { verifyToken } from './app/lib/auth'

export async function proxy(request) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  console.log('=== MIDDLEWARE ===')
  console.log('Time:', new Date().toISOString())
  console.log('Path:', pathname)
  console.log('Token present:', !!token)

  // Completely ignore these paths
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Public paths
  const publicPaths = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-otp', '/']
  
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    if (token && pathname !== '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    console.log('No token, redirecting to login')
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token (now async)
  try {
    const user = await verifyToken(token)
    
    if (!user) {
      console.log('Invalid token, clearing and redirecting')
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('token')
      return response
    }

    console.log('Valid user:', user.email, 'Role:', user.role)
    return NextResponse.next()
  } catch (error) {
    console.error('Token verification error:', error)
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('token')
    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
}