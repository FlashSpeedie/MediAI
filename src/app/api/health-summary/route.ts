// src/app/api/health-summary/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getGroqChatResponse } from '@/lib/groq';

// GET — fetch current health summary
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await prisma.healthSummary.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ summary: summary?.summary ?? null });
}

// POST — generate/update health summary from recent sessions
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get last 10 completed sessions with messages
  const sessions = await prisma.symptomSession.findMany({
    where: { userId: session.user.id, completed: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 20,
      },
    },
  });

  if (sessions.length === 0) {
    return NextResponse.json({ summary: null });
  }

  // Build text of past sessions for Groq to summarize
  const sessionTexts = sessions.map((s: any) => {
    const msgs = s.messages
      .map((m: any) => `${m.role}: ${m.content.substring(0, 200)}`)
      .join('\n');
    return `Session (${new Date(s.createdAt).toLocaleDateString()}): ${s.chiefComplaint}\nUrgency: ${s.urgencyLevel}\n${msgs}`;
  }).join('\n\n---\n\n');

  const { reply: summary } = await getGroqChatResponse(
    `Create a concise medical history summary (max 150 words) from these past health sessions. 
    Focus on: recurring symptoms, conditions identified, medications used, urgency patterns.
    Write in third person clinical style. Do NOT include dates, personal details, or contact info.
    Only include medically relevant patterns.\n\n${sessionTexts}`,
    []
  );

  // Save or update summary
  const existing = await prisma.healthSummary.findFirst({
    where: { userId: session.user.id },
  });

  if (existing) {
    await prisma.healthSummary.update({
      where: { id: existing.id },
      data: {
        summary,
        sessionCount: sessions.length,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.healthSummary.create({
      data: {
        userId: session.user.id,
        summary,
        sessionCount: sessions.length,
      },
    });
  }

  return NextResponse.json({ summary });
}
