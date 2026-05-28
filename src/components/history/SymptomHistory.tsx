'use client';
import { useState, useEffect } from 'react';
import { SymptomSessionRecord } from '@/types';
import { getUrgencyDisplay } from '@/lib/urgency';
import { Clock, Trash2, ChevronRight, Loader2 } from 'lucide-react';

export default function SymptomHistory() {
  const [sessions, setSessions] = useState<SymptomSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .finally(() => setLoading(false));
  }, []);

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this symptom session?')) return;
    setDeleting(id);
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No symptom sessions yet</p>
        <p className="text-sm mt-1">Start a chat to log your first session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const urgency = getUrgencyDisplay(session.urgencyLevel);
        return (
          <div
            key={session.id}
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition group"
          >
            {/* Urgency dot */}
            <span className="text-xl">{urgency.icon}</span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{session.chiefComplaint}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`text-xs font-medium ${urgency.color}`}>{urgency.label}</span>
                <span className="text-xs text-gray-400">
                  {new Date(session.createdAt).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
                {session.completed && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    Completed
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => deleteSession(session.id)}
                disabled={deleting === session.id}
                className="p-1.5 text-gray-400 hover:text-red-500 transition"
                aria-label="Delete session"
              >
                {deleting === session.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
