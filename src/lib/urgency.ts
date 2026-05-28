// src/lib/urgency.ts
import { UrgencyLevel, UrgencyAssessment } from '@/types';

export interface UrgencyDisplay {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  action: string;
  phoneNumber?: string;
}

export function getUrgencyDisplay(level: UrgencyLevel): UrgencyDisplay {
  const map: Record<UrgencyLevel, UrgencyDisplay> = {
    LOW: {
      label: '🟢 Low — Home Care',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      icon: '🟢',
      action: 'Monitor at home. Rest and stay hydrated.',
    },
    MEDIUM: {
      label: '🟡 Medium — See a Doctor',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      icon: '🟡',
      action: 'Schedule a doctor visit within 24–48 hours or visit urgent care.',
    },
    HIGH: {
      label: '🟠 High — Urgent Care / ER',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-400',
      icon: '🟠',
      action: 'Go to urgent care or the ER within a few hours. Do not delay.',
    },
    CRITICAL: {
      label: '🔴 CRITICAL — CALL 911',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      icon: '🔴',
      action: 'CALL 911 IMMEDIATELY or go to the nearest Emergency Room.',
      phoneNumber: '911',
    },
  };
  return map[level];
}

export function urgencyFromText(text: string): UrgencyLevel {
  const upper = text.toUpperCase();
  if (upper.includes('CRITICAL') || upper.includes('911')) return 'CRITICAL';
  if (upper.includes('[URGENCY: HIGH]')) return 'HIGH';
  if (upper.includes('[URGENCY: MEDIUM]')) return 'MEDIUM';
  if (upper.includes('[URGENCY: LOW]')) return 'LOW';
  return 'LOW';
}
