'use client';
import { useEffect, useRef } from 'react';
import { Message, UrgencyLevel } from '@/types';
import MessageBubble from './MessageBubble';
import UrgencyBanner from './UrgencyBanner';
import { Loader2 } from 'lucide-react';

interface Props {
  messages: Message[];
  urgencyLevel: UrgencyLevel;
  isLoading: boolean;
}

export default function ChatWindow({ messages, urgencyLevel, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showUrgencyBanner = urgencyLevel !== 'LOW' || messages.length > 6;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Show urgency banner once we have enough info */}
      {showUrgencyBanner && (
        <UrgencyBanner level={urgencyLevel} />
      )}

      {/* Messages */}
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isLatest={i === messages.length - 1}
        />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-gray-400 animate-typing"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}

