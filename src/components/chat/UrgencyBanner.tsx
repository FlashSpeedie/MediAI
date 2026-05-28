'use client';
import { UrgencyLevel } from '@/types';
import { getUrgencyDisplay } from '@/lib/urgency';
import { Phone, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface Props {
  level: UrgencyLevel;
  action?: string;
}

const icons = {
  LOW: CheckCircle,
  MEDIUM: Clock,
  HIGH: AlertCircle,
  CRITICAL: Phone,
};

export default function UrgencyBanner({ level, action }: Props) {
  const display = getUrgencyDisplay(level);
  const Icon = icons[level];

  return (
    <div
      className={`
        rounded-xl border-2 p-4 flex items-start gap-3 animate-fade-in
        ${display.bgColor} ${display.borderColor}
      `}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${display.color}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${display.color}`}>{display.label}</p>
        <p className={`text-sm mt-0.5 ${display.color} opacity-90`}>
          {action ?? display.action}
        </p>
        {level === 'CRITICAL' && (
          <a
            href="tel:911"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition animate-pulse-slow"
          >
            <Phone className="w-4 h-4" />
            Call 911 Now
          </a>
        )}
      </div>
    </div>
  );
}
