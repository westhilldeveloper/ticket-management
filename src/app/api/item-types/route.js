import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db'

/**
 * GET /api/item-types?mainCategory=IT&requestServiceType=REQUEST
 * Returns list of item types for the given category and service type.
 */ 
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mainCategory = searchParams.get('mainCategory');
    const requestServiceType = searchParams.get('requestServiceType');

    if (!mainCategory || !requestServiceType) {
      return NextResponse.json(
        { error: 'mainCategory and requestServiceType are required' },
        { status: 400 }
      );
    }

    // Find the category by name (IT, ADMIN, HR)
    const category = await prisma.dynamicCategory.findUnique({
      where: { name: mainCategory }
    });

    if (!category) {
      // No category found – return empty array (no options)
      return NextResponse.json({ items: [] });
    }

    // Fetch active item types for this category and request/service type
    const items = await prisma.itemType.findMany({
      where: {
        categoryId: category.id,
        type: requestServiceType,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true
      }
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching item types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}