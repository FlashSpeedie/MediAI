import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateRequest, familyJoinSchema } from '@/lib/validation';
import { authRateLimiter, addRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResult = await authRateLimiter(request);

  try {
    const body = await request.json();
    const validation = validateRequest(familyJoinSchema, body);

    if (!validation.success) {
      const response = NextResponse.json({ error: validation.error }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const { code } = validation.data;

    const family = await prisma.familyGroup.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: { members: true },
    });

    if (!family) {
      const response = NextResponse.json({ error: 'Invalid family code' }, { status: 404 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    // Check already a member
    const alreadyMember = family.members.some((m) => m.id === session.user!.id);
    if (alreadyMember) {
      const response = NextResponse.json({ error: 'Already a member of this family' }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    await prisma.familyGroup.update({
      where: { id: family.id },
      data: { members: { connect: { id: session.user!.id } } },
    });

    await prisma.user.update({
      where: { id: session.user!.id },
      data: { familyGroupId: family.id, familyRole: 'member' },
    });

    const response = NextResponse.json({ success: true, familyName: family.name });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Family join error:', error);
    const response = NextResponse.json({ error: 'Failed to join family group' }, { status: 500 });
    return addRateLimitHeaders(response, rateLimitResult);
  }
}
