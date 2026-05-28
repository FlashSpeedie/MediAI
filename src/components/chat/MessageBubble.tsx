'use client';
import { Message } from '@/types';
import { Stethoscope, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple markdown-like renderer (bold, line breaks)
function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
}

interface Props {
  message: Message;
  isLatest?: boolean;
}

export default function MessageBubble({ message, isLatest }: Props) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-brand-600 text-white' : 'bg-blue-100 text-blue-600'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Stethoscope className="w-4 h-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
        )}
      >
        {/* Image preview */}
        {message.metadata?.imageUrl && (
          <div className="mt-2 mb-1">
            <img
              src={message.metadata.imageUrl}
              alt="Uploaded"
              className="rounded-lg max-w-[200px] max-h-[150px] object-cover border border-gray-200"
            />
          </div>
        )}

        {renderContent(message.content)}

        {/* Medicine recommendations */}
        {message.metadata?.recommendedMedicines?.length ? (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">💊 OTC Options to Consider:</p>
            <div className="flex flex-wrap gap-1.5">
              {message.metadata.recommendedMedicines.map((med) => (
                <span
                  key={med.name}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200"
                >
                  {med.name} ({med.genericName})
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Timestamp */}
        <p className={cn(
          'text-xs mt-1.5 opacity-60',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
