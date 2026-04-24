import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db'
import { isAdmin } from '@/app/lib/auth';

export async function GET(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const items = await prisma.itemType.findMany({
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { sortOrder: 'asc' }]
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, categoryName, type, sortOrder } = await request.json();
    let category = await prisma.itemCategory.findUnique({
      where: { name: categoryName }
    });
    if (!category) {
      category = await prisma.itemCategory.create({
        data: { name: categoryName }
      });
    }
    const itemType = await prisma.itemType.create({
      data: {
        name,
        categoryId: category.id,
        type,
        sortOrder: sortOrder ?? 0
      }
    });
    return NextResponse.json(itemType, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}