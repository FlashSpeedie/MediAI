import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateRequest, onboardingSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = validateRequest(onboardingSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        age: data.age,
        gender: data.gender,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        bloodType: data.bloodType,
        heartRateBpm: data.heartRateBpm,
        bloodPressure: data.bloodPressure,
        activityLevel: data.activityLevel,
        dietType: data.dietType,
        smokingStatus: data.smokingStatus,
        alcoholUse: data.alcoholUse,
        chronicConditions: data.chronicConditions ?? [],
        currentMedications: data.currentMedications ?? [],
        knownAllergies: data.knownAllergies ?? [],
        accountType: data.accountType ?? 'SOLO',
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
