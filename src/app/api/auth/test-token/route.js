import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { message: 'No token found' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    
    return NextResponse.json({
      success: true,
      tokenExists: true,
      decoded,
      hasId: decoded ? !!decoded.id : false,
      id: decoded?.id,
      email: decoded?.email,
      role: decoded?.role,
      allKeys: decoded ? Object.keys(decoded) : []
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}