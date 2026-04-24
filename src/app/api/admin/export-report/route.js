import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'
import { format } from 'date-fns'

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.id || decoded.userId || decoded.sub
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token structure' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Build ticket filter based on role (same as other endpoints)
    let ticketWhere = {}
    
    if (user.role === 'ADMIN' && user.department) {
      // Resolve department name to DynamicCategory ID
      const category = await prisma.dynamicCategory.findFirst({
        where: { name: user.department }
      })
      if (category) {
        ticketWhere.mainCategoryId = category.id
      } else {
        // No matching category -> no tickets
        ticketWhere.id = null // force empty result
      }
    } else if (user.role === 'SUPER_ADMIN') {
      // no filter
    }

    // Fetch tickets with optional filter
    const tickets = await prisma.ticket.findMany({
      where: ticketWhere,
      include: {
        createdBy: {
          select: { name: true, email: true, department: true }
        },
        assignedTo: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Fetch all users (no filter for super admin; for admin? Usually admin sees all users, but may restrict)
    // For consistency, we'll show all users (admin can see all users). If needed, filter by department.
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true
      }
    })

    // Generate CSV content
    let csv = 'Report Type,Generated Date,Total Tickets,Open Tickets,Resolved Tickets,Closed Tickets\n'
    csv += `System Report,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')},${tickets.length},${
      tickets.filter(t => t.status === 'OPEN').length
    },${
      tickets.filter(t => t.status === 'RESOLVED').length
    },${
      tickets.filter(t => t.status === 'CLOSED').length
    }\n\n`

    csv += 'TICKETS LIST\n'
    csv += 'Ticket Number,Title,Category,Priority,Status,Created By,Assigned To,Created Date\n'
    
    tickets.forEach(ticket => {
      csv += `"${ticket.ticketNumber}","${ticket.title.replace(/"/g, '""')}",${ticket.category},${ticket.priority},${ticket.status},${ticket.createdBy?.name || 'N/A'},${ticket.assignedTo?.name || 'Unassigned'},${format(new Date(ticket.createdAt), 'yyyy-MM-dd')}\n`
    })

    csv += '\nUSERS LIST\n'
    csv += 'Name,Email,Role,Department,Status,Created Date\n'
    
    users.forEach(user => {
      csv += `"${user.name.replace(/"/g, '""')}",${user.email},${user.role},${user.department || 'N/A'},${user.isActive ? 'Active' : 'Inactive'},${format(new Date(user.createdAt), 'yyyy-MM-dd')}\n`
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="admin-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}