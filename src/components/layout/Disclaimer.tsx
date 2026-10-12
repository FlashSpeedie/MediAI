'use client';
import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Medical Disclaimer:</strong> MediAI is an AI triage tool -{' '}
            <strong>not a licensed physician</strong>. Do not use for emergencies.{' '}
            <strong>Call 911 if you have a life-threatening situation.</strong>
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 flex-shrink-0"
          aria-label="Dismiss disclaimer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

