// src/lib/user-context.ts

import { UserContextForAI } from '@/types';

export function buildUserContextString(context: UserContextForAI): string {
  const parts: string[] = [];

  // Date and time — always included
  parts.push(`[Current Date & Time: ${context.currentDateTime}]`);
  parts.push(`[Day: ${context.dayOfWeek}]`);

  // Demographics
  const demographics: string[] = [];
  if (context.gender) demographics.push(context.gender);
  if (context.age) demographics.push(`${context.age} years old`);
  if (demographics.length) parts.push(demographics.join(', '));

  // Physical stats
  if (context.heightCm && context.weightKg) {
    const bmi = context.weightKg / Math.pow(context.heightCm / 100, 2);
    const bmiCategory =
      bmi < 18.5 ? 'underweight' :
      bmi < 25 ? 'normal weight' :
      bmi < 30 ? 'overweight' : 'obese';
    parts.push(`Height: ${context.heightCm}cm, Weight: ${context.weightKg}kg, BMI: ${bmi.toFixed(1)} (${bmiCategory})`);
  }

  if (context.bloodType && context.bloodType !== 'Unknown') {
    parts.push(`Blood type: ${context.bloodType}`);
  }

  if (context.heartRateBpm) {
    const hrCategory =
      context.heartRateBpm < 60 ? 'bradycardic' :
      context.heartRateBpm <= 100 ? 'normal' : 'elevated';
    parts.push(`Resting HR: ${context.heartRateBpm} bpm (${hrCategory})`);
  }

  if (context.bloodPressure) {
    parts.push(`Blood pressure: ${context.bloodPressure} mmHg`);
  }

  // Lifestyle
  if (context.dietType) parts.push(`Diet: ${context.dietType}`);
  if (context.activityLevel) parts.push(`Activity: ${context.activityLevel}`);
  if (context.smokingStatus && context.smokingStatus !== 'Never smoked') {
    parts.push(`Smoking: ${context.smokingStatus}`);
  }
  if (context.alcoholUse && context.alcoholUse !== 'None') {
    parts.push(`Alcohol: ${context.alcoholUse}`);
  }

  // Medical history
  if (context.chronicConditions?.length && !context.chronicConditions.includes('None')) {
    parts.push(`Chronic conditions: ${context.chronicConditions.join(', ')}`);
  }

  if (context.currentMedications?.length && !context.currentMedications.includes('None')) {
    parts.push(`Current medications: ${context.currentMedications.join(', ')}`);
  }

  if (context.knownAllergies?.length && !context.knownAllergies.includes('None')) {
    parts.push(`⚠️ ALLERGIES: ${context.knownAllergies.join(', ')}`);
  }

  // Past health summary
  if (context.pastHealthSummary) {
    parts.push(`\nPast Health Summary:\n${context.pastHealthSummary}`);
  }

  return parts.join('\n');
}

export function getUserContextFromProfile(
  profile: {
    age?: number | null;
    gender?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    bloodType?: string | null;
    heartRateBpm?: number | null;
    bloodPressure?: string | null;
    activityLevel?: string | null;
    dietType?: string | null;
    smokingStatus?: string | null;
    alcoholUse?: string | null;
    chronicConditions?: string[];
    currentMedications?: string[];
    knownAllergies?: string[];
  },
  pastHealthSummary?: string | null
): UserContextForAI {
  const now = new Date();

  return {
    age: profile.age ?? undefined,
    gender: profile.gender ?? undefined,
    heightCm: profile.heightCm ?? undefined,
    weightKg: profile.weightKg ?? undefined,
    bloodType: profile.bloodType ?? undefined,
    heartRateBpm: profile.heartRateBpm ?? undefined,
    bloodPressure: profile.bloodPressure ?? undefined,
    activityLevel: profile.activityLevel ?? undefined,
    dietType: profile.dietType ?? undefined,
    smokingStatus: profile.smokingStatus ?? undefined,
    alcoholUse: profile.alcoholUse ?? undefined,
    chronicConditions: profile.chronicConditions ?? [],
    currentMedications: profile.currentMedications ?? [],
    knownAllergies: profile.knownAllergies ?? [],
    currentDateTime: now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
    currentDate: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    currentTime: now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    pastHealthSummary: pastHealthSummary ?? undefined,
  };
}
