import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGroqChatResponse } from '@/lib/groq';
import { analyzeImage } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { validateRequest, chatApiRequestSchema, ChatApiRequest } from '@/lib/validation';
import { buildUserContextString, getUserContextFromProfile } from '@/lib/user-context';
import { chatRateLimiter, addRateLimitHeaders } from '@/lib/rate-limit';
import { EMERGENCY_KEYWORDS, HIGH_URGENCY_KEYWORDS } from '@/constants/triage';
import { UrgencyLevel } from '@/types';
import { parseUrgencyFromResponse, extractMedicineRecommendations, buildUrgencyAssessment, validateChatResponse } from '@/lib/chat-response';

interface ValidatedChatResponse {
  reply: string;
  urgencyLevel: UrgencyLevel;
  urgencyAssessment?: {
    level: UrgencyLevel;
    reason: string;
    action: string;
    callEmergency: boolean;
    goToER: boolean;
  };
  recommendedMedicines: Array<{
    name: string;
    genericName: string;
    dosage: string;
    frequency: string;
    warnings: string[];
    conditions: string[];
    category: string;
    requiresPrescription: boolean;
  }>;
  followUpQuestion?: string;
  triageComplete: boolean;
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await chatRateLimiter(request);

  try {
    const session = await auth();
    const body = await request.json();
    const validation = validateRequest(chatApiRequestSchema, body);

    if (!validation.success) {
      const response = NextResponse.json({ error: validation.error }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const { message, sessionId, imageBase64, conversationHistory } = validation.data;

    if (!message?.trim() && !imageBase64) {
      const response = NextResponse.json({ error: 'Message is required' }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    let activeSessionId = sessionId;

    if (session?.user?.id && !activeSessionId) {
      const dbSession = await prisma.symptomSession.create({
        data: {
          userId: session.user.id,
          chiefComplaint: (message ?? '').substring(0, 200),
        },
      });
      activeSessionId = dbSession.id;
    }

    let fullMessage = message ?? '';
    if (imageBase64) {
      const imageAnalysis = await analyzeImage(imageBase64, 'image/jpeg', message ?? '');
      fullMessage = `${fullMessage}\n\n[Camera Analysis]: ${imageAnalysis}`;
    }

    // Emergency keyword detection - deterministic safety layer
    const lowerMessage = fullMessage.toLowerCase();
    const isEmergency = EMERGENCY_KEYWORDS.some((kw) => lowerMessage.includes(kw));
    const isHighUrgency = HIGH_URGENCY_KEYWORDS.some((kw) => lowerMessage.includes(kw));

    if (isEmergency) {
      const emergencyResponse: ValidatedChatResponse = {
        reply: `🚨 **EMERGENCY DETECTED** 🚨\n\nBased on what you've described, this may be a **medical emergency**.\n\n## CALL 911 IMMEDIATELY\n\nDo not wait. Call **911** or go to the nearest Emergency Room right now.\n\n[URGENCY: CRITICAL]\n\n⚠️ DISCLAIMER: I am an AI assistant, not a licensed physician. This is not medical advice.`,
        urgencyLevel: 'CRITICAL',
        urgencyAssessment: {
          level: 'CRITICAL',
          reason: 'Emergency keywords detected',
          action: 'Call 911 immediately',
          callEmergency: true,
          goToER: true,
        },
        recommendedMedicines: [],
        triageComplete: true,
};
      if (session?.user?.id && activeSessionId) {
        await prisma.$transaction([
          prisma.message.create({
            data: { sessionId: activeSessionId, role: 'USER', content: message ?? '' },
          }),
          prisma.message.create({
            data: {
              sessionId: activeSessionId,
              role: 'ASSISTANT',
              content: emergencyResponse.reply,
              metadata: {
                urgencyLevel: emergencyResponse.urgencyLevel,
                recommendedMedicines: [],
              },
            },
          }),
          prisma.symptomSession.update({
            where: { id: activeSessionId },
            data: { urgencyLevel: 'CRITICAL', completed: true },
          }),
        ]);
      }

      const response = NextResponse.json({
        ...emergencyResponse,
        sessionId: activeSessionId ?? `temp-${Date.now()}`,
      });
      return addRateLimitHeaders(response, rateLimitResult);
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
      await getGroqChatResponse(fullMessage ?? '', groqHistory, userContextString);

    // Validate and structure the AI response
    const validatedResponse = validateChatResponse({
      reply,
      urgencyLevel,
      urgencyAssessment,
      recommendedMedicines,
    });

    // Emergency detection takes priority over AI assessment
    if (isEmergency) {
      validatedResponse.urgencyLevel = 'CRITICAL';
      validatedResponse.urgencyAssessment = {
        level: 'CRITICAL',
        reason: 'Emergency keywords detected',
        action: 'Call 911 immediately',
        callEmergency: true,
        goToER: true,
      };
      validatedResponse.triageComplete = true;
    }

    const triageComplete = validatedResponse.triageComplete;

    if (session?.user?.id && activeSessionId) {
      await prisma.$transaction([
        prisma.message.create({
          data: { sessionId: activeSessionId, role: 'USER', content: message ?? '' },
        }),
        prisma.message.create({
          data: {
            sessionId: activeSessionId,
            role: 'ASSISTANT',
            content: validatedResponse.reply,
            metadata: {
              urgencyLevel: validatedResponse.urgencyLevel,
              recommendedMedicines: validatedResponse.recommendedMedicines.map((m: { name: string }) => m.name),
            },
          },
        }),
        prisma.symptomSession.update({
          where: { id: activeSessionId },
          data: { urgencyLevel: validatedResponse.urgencyLevel },
        }),
      ]);

      // Mark session complete and trigger summary update
      if (triageComplete) {
        await prisma.symptomSession.update({
          where: { id: activeSessionId },
          data: { completed: true },
        });

        // Trigger summary update with proper error handling
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health-summary`, {
            method: 'POST',
            headers: { 'Cookie': request.headers.get('cookie') ?? '' },
          });
        } catch {
          // Log but don't fail the main response
          console.warn('Health summary generation failed');
        }
      }
    }

    const response = NextResponse.json({
      reply: validatedResponse.reply,
      urgencyLevel: validatedResponse.urgencyLevel,
      urgencyAssessment: validatedResponse.urgencyAssessment,
      recommendedMedicines: validatedResponse.recommendedMedicines,
      sessionId: activeSessionId ?? `temp-${Date.now()}`,
      triageComplete,
      followUpQuestion: validatedResponse.followUpQuestion,
    });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Chat API error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
    return addRateLimitHeaders(response, rateLimitResult);
  }
}
