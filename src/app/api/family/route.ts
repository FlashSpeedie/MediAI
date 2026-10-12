import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateRequest, familyCreateSchema } from '@/lib/validation';
import { authRateLimiter, addRateLimitHeaders } from '@/lib/rate-limit';

// Generate random 6-char alphanumeric code
function generateFamilyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// POST — create family group
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResult = await authRateLimiter(request);

  try {
    const body = await request.json();
    const validation = validateRequest(familyCreateSchema, body);

    if (!validation.success) {
      const response = NextResponse.json({ error: validation.error }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const { familyName } = validation.data;

    // Generate unique code
    let code = generateFamilyCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.familyGroup.findUnique({ where: { code } });
      if (!existing) break;
      code = generateFamilyCode();
      attempts++;
    }

    const family = await prisma.familyGroup.create({
      data: {
        name: familyName.trim(),
        code,
        adminId: session.user.id,
        members: { connect: { id: session.user.id } },
      },
      include: { members: { select: { id: true, name: true, image: true, age: true, gender: true, onboardingComplete: true } } },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyGroupId: family.id, familyRole: 'admin' },
    });

    const response = NextResponse.json({ family }, { status: 201 });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Family create error:', error);
    const response = NextResponse.json({ error: 'Failed to create family group' }, { status: 500 });
    return addRateLimitHeaders(response, rateLimitResult);
  }
}

// GET — get current user's family
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      familyGroup: {
        include: {
          members: {
            select: {
              id: true, name: true, image: true,
              age: true, gender: true, onboardingComplete: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ family: user?.familyGroup ?? null });
}