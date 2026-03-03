import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { format } from 'date-fns'

export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    })

    // Generate CSV
    let csv = 'Name,Email,Role,Department,Status,Email Verified,Created Date\n'
    
    users.forEach(user => {
      csv += `"${user.name.replace(/"/g, '""')}",${user.email},${user.role},${user.department || 'N/A'},${user.isActive ? 'Active' : 'Inactive'},${user.emailVerified ? 'Yes' : 'No'},${format(new Date(user.createdAt), 'yyyy-MM-dd')}\n`
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}