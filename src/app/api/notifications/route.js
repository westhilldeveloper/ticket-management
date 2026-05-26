import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { verifyToken } from '@/app/lib/auth';

// GET /api/notifications – fetch user's notifications
export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const daily = searchParams.get('daily') === 'true';

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Build where clause for fetching notifications
    let whereClause = { userId: decoded.id };
    if (unreadOnly) whereClause.read = false;
    if (daily) {
      whereClause.createdAt = { gte: startOfDay };
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        ticket: { select: { ticketNumber: true, title: true, id: true } },
      },
    });

    // Build where clause for unread count – should match the same scope
    let unreadWhere = { userId: decoded.id, read: false };
    if (daily) {
      unreadWhere.createdAt = { gte: startOfDay };
    }

    const unreadCount = await prisma.notification.count({ where: unreadWhere });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications – mark notifications as read
export async function PUT(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { notificationIds, markAll } = await request.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: decoded.id, read: false },
        data: { read: true, readAt: new Date() },
      });
    } else if (notificationIds && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId: decoded.id },
        data: { read: true, readAt: new Date() },
      });
    }

    return NextResponse.json({ message: 'Notifications updated' });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}