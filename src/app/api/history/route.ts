// src/app/api/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/history — get all sessions for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await prisma.symptomSession.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ sessions });
}

// POST /api/history — mark session as complete + generate summary
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId, summary } = await request.json();

  const updated = await prisma.symptomSession.update({
    where: { id: sessionId, userId: session.user.id },
    data: { completed: true, summary },
  });

  return NextResponse.json({ session: updated });
}
