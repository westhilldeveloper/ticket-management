import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import { prisma } from '@/app/lib/db'

export async function GET(request) {
  try {
    // Get token from cookies
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { categories: ['HR', 'IT', 'TECHNICAL', 'GENERAL'] } // Return defaults even if not authenticated
      )
    }

    // Verify token
    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { categories: ['HR', 'IT', 'TECHNICAL', 'GENERAL'] }
      )
    }

    // You could fetch categories from database if needed
    // For now, return static categories
    return NextResponse.json({
      categories: ['HR', 'IT', 'TECHNICAL', 'GENERAL']
    })
    
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { categories: ['HR', 'IT', 'TECHNICAL', 'GENERAL'] }
    )
  }
}