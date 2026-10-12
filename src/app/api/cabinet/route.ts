import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { validateRequest, cabinetCreateSchema, CabinetCreateRequest } from '@/lib/validation';
import { cabinetRateLimiter, addRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResult = await cabinetRateLimiter(request);
  const response = await handleGetCabinet(session.user.id);
  return addRateLimitHeaders(response, rateLimitResult);
}

async function handleGetCabinet(userId: string) {
  const items = await prisma.medicineCabinet.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResult = await cabinetRateLimiter(request);

  try {
    const body = await request.json();
    const validation = validateRequest(cabinetCreateSchema, body);
    
    if (!validation.success) {
      const response = NextResponse.json({ error: validation.error }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const data: CabinetCreateRequest = validation.data;
    const expirationDate = data.expirationDate ? new Date(data.expirationDate) : null;

    const item = await prisma.medicineCabinet.create({
      data: {
        userId: session.user.id,
        productName: data.productName,
        brandName: data.brandName,
        genericName: data.genericName,
        strength: data.strength,
        dosageForm: data.dosageForm,
        ndc: data.ndc,
        manufacturer: data.manufacturer,
        expirationDate,
        notes: data.notes,
        verificationState: data.verificationState as 'NEEDS_REVIEW' | 'USER_CONFIRMED' | 'UNABLE_TO_MATCH',
        sourceIdentifiers: data.sourceIdentifiers as Prisma.InputJsonValue | undefined,
      },
    });

    const response = NextResponse.json({ item }, { status: 201 });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Cabinet create error:', error);
    const response = NextResponse.json({ error: 'Failed to create cabinet item' }, { status: 500 });
    return addRateLimitHeaders(response, rateLimitResult);
  }
}
