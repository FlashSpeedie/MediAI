// src/app/api/onboarding/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      age, gender, heightCm, weightKg, bloodType,
      heartRateBpm, bloodPressure, activityLevel, dietType,
      smokingStatus, alcoholUse, chronicConditions,
      currentMedications, knownAllergies, accountType,
    } = body;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        age: age ? parseInt(age) : undefined,
        gender,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        bloodType,
        heartRateBpm: heartRateBpm ? parseInt(heartRateBpm) : undefined,
        bloodPressure,
        activityLevel,
        dietType,
        smokingStatus,
        alcoholUse,
        chronicConditions: chronicConditions ?? [],
        currentMedications: currentMedications ?? [],
        knownAllergies: knownAllergies ?? [],
        accountType: accountType ?? 'SOLO',
        onboardingComplete: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      age: true, gender: true, heightCm: true, weightKg: true,
      bloodType: true, heartRateBpm: true, bloodPressure: true,
      activityLevel: true, dietType: true, smokingStatus: true,
      alcoholUse: true, chronicConditions: true, currentMedications: true,
      knownAllergies: true, accountType: true, onboardingComplete: true,
      familyGroupId: true, familyRole: true,
    },
  });

  return NextResponse.json({ profile: user });
}
