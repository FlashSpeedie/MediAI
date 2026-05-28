// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGroqChatResponse } from '@/lib/groq';
import { analyzeImage } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { ChatApiRequest } from '@/types';
import { buildUserContextString, getUserContextFromProfile } from '@/lib/user-context';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body: ChatApiRequest = await request.json();
    const { message, sessionId, imageBase64, conversationHistory } = body;

    if (!message?.trim() && !imageBase64) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let activeSessionId = sessionId;

    if (session?.user?.id && !activeSessionId) {
      const dbSession = await prisma.symptomSession.create({
        data: {
          userId: session.user.id,
          chiefComplaint: message.substring(0, 200),
        },
      });
      activeSessionId = dbSession.id;
    }

    let fullMessage = message;
    if (imageBase64) {
      const imageAnalysis = await analyzeImage(imageBase64, 'image/jpeg', message);
      fullMessage = `${message}\n\n[Camera Analysis]: ${imageAnalysis}`;
    }

    // Fetch user health profile and past summary
    let userContextString = '';
    if (session?.user?.id) {
      const userProfile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          age: true, gender: true, heightCm: true, weightKg: true,
          bloodType: true, heartRateBpm: true, bloodPressure: true,
          activityLevel: true, dietType: true, smokingStatus: true,
          alcoholUse: true, chronicConditions: true,
          currentMedications: true, knownAllergies: true,
        },
      });

      const healthSummary = await prisma.healthSummary.findFirst({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
      });

      if (userProfile) {
        const userContext = getUserContextFromProfile(
          userProfile,
          healthSummary?.summary
        );
        userContextString = buildUserContextString(userContext);
      }
    }

    // Sanitize and fix conversation history before sending to Groq
    // Convert to Groq format {role: 'user' | 'assistant', content: string}
    // Ensure proper alternating structure
    const groqHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of (conversationHistory ?? [])) {
      if (!msg?.content?.trim()) continue;
      const role = msg.role === 'user' ? 'user' as const : 'assistant' as const;
      const content = msg.content.trim();
      
      if (groqHistory.length === 0) {
        if (role === 'user') groqHistory.push({ role, content });
      } else {
        const lastRole = groqHistory[groqHistory.length - 1].role;
        if (role !== lastRole) {
          groqHistory.push({ role, content });
        } else {
          groqHistory[groqHistory.length - 1].content += '\n' + content;
        }
      }
    }

    const { reply, urgencyLevel, urgencyAssessment, recommendedMedicines } =
      await getGroqChatResponse(fullMessage, groqHistory, userContextString);

    const triageComplete = (conversationHistory?.length ?? 0) >= 8;

    if (session?.user?.id && activeSessionId) {
      await prisma.$transaction([
        prisma.message.create({
          data: { sessionId: activeSessionId, role: 'USER', content: message },
        }),
        prisma.message.create({
          data: {
            sessionId: activeSessionId,
            role: 'ASSISTANT',
            content: reply,
            metadata: {
              urgencyLevel,
              recommendedMedicines: recommendedMedicines.map((m) => m.name),
            },
          },
        }),
        prisma.symptomSession.update({
          where: { id: activeSessionId },
          data: { urgencyLevel },
        }),
      ]);

      // Mark session complete and trigger summary update in background
      if (triageComplete) {
        await prisma.symptomSession.update({
          where: { id: activeSessionId },
          data: { completed: true },
        });
        // Trigger summary update in background
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health-summary`, {
          method: 'POST',
          headers: { 'Cookie': request.headers.get('cookie') ?? '' },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      reply,
      urgencyLevel,
      urgencyAssessment,
      recommendedMedicines,
      sessionId: activeSessionId ?? `temp-${Date.now()}`,
      triageComplete,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
