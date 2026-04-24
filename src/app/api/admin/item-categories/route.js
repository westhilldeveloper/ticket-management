import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db'
import { isAdmin } from '@/app/lib/auth';

// GET all categories (admin only)
export async function GET(request) { 
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const categories = await prisma.itemCategory.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST - Create a new category (admin only)
export async function POST(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, description } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    const upperName = name.trim().toUpperCase();
    // Check if category already exists
    const existing = await prisma.itemCategory.findUnique({
      where: { name: upperName }
    });
    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    const category = await prisma.itemCategory.create({
      data: { name: upperName, description: description || '' }
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// DELETE - Remove a category (and cascade delete its item types)
export async function DELETE(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: 'Category name required' }, { status: 400 });
    }
    // First delete all item types under this category (Prisma will cascade if you set onDelete: Cascade)
    await prisma.itemCategory.delete({
      where: { name: name.toUpperCase() }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}