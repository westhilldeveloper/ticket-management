import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { isAdmin } from '@/app/lib/auth';

export async function PUT(request, { params }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;   // ✅ await the params Promise
    const { name, sortOrder } = await request.json();
    const updated = await prisma.itemType.update({
      where: { id },
      data: { name, sortOrder }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;   // ✅ await the params Promise
    const { isActive } = await request.json();
    const updated = await prisma.itemType.update({
      where: { id },
      data: { isActive }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;   // ✅ await the params Promise
    await prisma.itemType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}