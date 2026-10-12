import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateRequest, cabinetUpdateSchema, CabinetUpdateRequest } from '@/lib/validation';
import { cabinetRateLimiter, addRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.medicineCabinet.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const rateLimitResult = await cabinetRateLimiter(request);

  try {
    const body = await request.json();
    const validation = validateRequest(cabinetUpdateSchema, { ...body, id });
    
    if (!validation.success) {
      const response = NextResponse.json({ error: validation.error }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const data: CabinetUpdateRequest = validation.data;
    const expirationDate = data.expirationDate ? new Date(data.expirationDate) : null;

    const existing = await prisma.medicineCabinet.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      const response = NextResponse.json({ error: 'Item not found' }, { status: 404 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const updateData: Record<string, unknown> = {
      productName: data.productName ?? existing.productName,
      brandName: data.brandName ?? existing.brandName,
      genericName: data.genericName ?? existing.genericName,
      strength: data.strength ?? existing.strength,
      dosageForm: data.dosageForm ?? existing.dosageForm,
      ndc: data.ndc ?? existing.ndc,
      manufacturer: data.manufacturer ?? existing.manufacturer,
      expirationDate,
      notes: data.notes ?? existing.notes,
      verificationState: data.verificationState ?? existing.verificationState,
      sourceIdentifiers: data.sourceIdentifiers ?? existing.sourceIdentifiers,
    };

    // If key identifying fields changed, reset verification state
    if (
      data.productName && data.productName !== existing.productName ||
      data.brandName !== existing.brandName ||
      data.genericName !== existing.genericName ||
      data.ndc !== existing.ndc
    ) {
      updateData.verificationState = 'NEEDS_REVIEW';
    }

    const item = await prisma.medicineCabinet.update({
      where: { id },
      data: updateData,
    });

    const response = NextResponse.json({ item });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Cabinet update error:', error);
    const response = NextResponse.json({ error: 'Failed to update cabinet item' }, { status: 500 });
    return addRateLimitHeaders(response, rateLimitResult);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const rateLimitResult = await cabinetRateLimiter(request);

  const existing = await prisma.medicineCabinet.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    const response = NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return addRateLimitHeaders(response, rateLimitResult);
  }

  await prisma.medicineCabinet.delete({ where: { id } });

  const response = NextResponse.json({ success: true });
  return addRateLimitHeaders(response, rateLimitResult);
}