// src/app/api/family/join/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code?.trim()) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  const family = await prisma.familyGroup.findUnique({
    where: { code: code.toUpperCase().trim() },
    include: { members: true },
  });

  if (!family) {
    return NextResponse.json({ error: 'Invalid family code' }, { status: 404 });
  }

  // Check already a member
  const alreadyMember = family.members.some((m: { id: string }) => m.id === session.user!.id);
  if (alreadyMember) {
    return NextResponse.json({ error: 'Already a member of this family' }, { status: 400 });
  }

  await prisma.familyGroup.update({
    where: { id: family.id },
    data: { members: { connect: { id: session.user!.id } } },
  });

  await prisma.user.update({
    where: { id: session.user!.id },
    data: { familyGroupId: family.id, familyRole: 'member' },
  });

  return NextResponse.json({ success: true, familyName: family.name });
}
