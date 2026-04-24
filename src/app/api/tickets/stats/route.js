import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const user = await getCurrentUser(token);

    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Helper to resolve department name to DynamicCategory ID
    const resolveCategoryId = async (deptName) => {
      if (!deptName) return null;
      const category = await prisma.dynamicCategory.findFirst({
        where: { name: deptName }
      });
      return category?.id || null;
    };

    // Build base where clause based on user role (using mainCategoryId)
    let where = {};

    if (user.role === 'SUPER_ADMIN') {
      // all tickets – no extra filter
    } else if (user.role === 'MD') {
      // all tickets – no extra filter
    } else if (user.role === 'ADMIN') {
      if (user.department) {
        const categoryId = await resolveCategoryId(user.department);
        if (categoryId) {
          where.mainCategoryId = categoryId;
        } else {
          // No matching category -> return zeros
          return NextResponse.json({
            stats: { total: 0, open: 0, pending: 0, resolved: 0, closed: 0 }
          });
        }
      } else {
        // Admin without department -> see nothing
        where.mainCategoryId = null;
      }
    } else if (user.role === 'SERVICE_TEAM') {
      where.assignedToId = user.id;
    } else { // EMPLOYEE
      where.createdById = user.id;
    }

    // Define status groups
    const openStatus = 'OPEN';
    const resolvedStatus = 'RESOLVED';
    const closedStatus = 'CLOSED';
    
    // All other statuses are considered "pending"
    const pendingStatuses = [
      'PENDING_MD_APPROVAL',
      'PENDING_THIRD_PARTY',
      'IN_PROGRESS',
      'APPROVED_BY_MD',
      'REJECTED_BY_MD',
      'REJECTED_BY_SERVICE',
      'PENDING_SERVICE_ACCEPTANCE',
      'SERVICE_IN_PROGRESS',
      'SERVICE_RESOLVED',
    ];

    const [total, open, resolved, closed, pending] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: openStatus } }),
      prisma.ticket.count({ where: { ...where, status: resolvedStatus } }),
      prisma.ticket.count({ where: { ...where, status: closedStatus } }),
      prisma.ticket.count({ where: { ...where, status: { in: pendingStatuses } } }),
    ]);

    return NextResponse.json({
      stats: { total, open, pending, resolved, closed },
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}