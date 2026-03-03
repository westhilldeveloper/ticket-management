import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { verifyToken } from '@/app/lib/auth'

export async function GET(request, { params }) {
  try {
    // Await params in Next.js 15
    const { ticketId } = await params
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value
    let user = null

    if (token) {
      // AWAIT token verification
      const decoded = await verifyToken(token)
      if (decoded && decoded.id) {
        user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        })
      }
    }

    // Rest of your code remains the same...
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        reviews: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        history: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Check access based on role
    const hasAccess = 
      user?.role === 'SUPER_ADMIN' ||
      user?.role === 'ADMIN' ||
      user?.role === 'MD' ||
      ticket.createdById === user?.id ||
      ticket.assignedToId === user?.id

    // For public access (no user or no access), show limited info
    if (!user || !hasAccess) {
      const publicTicket = {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        attachment: ticket.attachment,
        createdBy: {
          name: 'Ticket Creator'
        },
        reviews: ticket.reviews?.filter(r => r.reviewType !== 'INTERNAL_NOTE').map(r => ({
          ...r,
          createdBy: { 
            name: r.createdBy?.name || 'System',
            role: r.createdBy?.role
          }
        })),
        history: ticket.history?.map(h => ({
          action: h.action,
          description: h.description,
          createdAt: h.createdAt
        }))
      }
      return NextResponse.json({ ticket: publicTicket })
    }

    return NextResponse.json({ ticket })

  } catch (error) {
    console.error('Error fetching public ticket:', error)
    return NextResponse.json(
      { message: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}