// src/hooks/useChat.ts
'use client';
import { useState, useCallback, useRef } from 'react';
import { Message, UrgencyLevel, Medicine, ChatSession } from '@/types';
import { TRIAGE_QUESTIONS } from '@/constants/triage';

const INITIAL_MESSAGE: Message = {
  id: 'init-0',
  role: 'assistant',
  content: `👋 Hello! I'm **MediAI**, your AI medical triage assistant.

I'll ask you a few questions to understand your symptoms and help guide you on what to do next.

**Important:** I am NOT a licensed physician. I provide triage guidance only - always consult a real healthcare professional for medical decisions.

Let's begin: **What is your main symptom or concern today?**`,
  timestamp: new Date(),
};

export function useChat() {
  const [session, setSession] = useState<ChatSession>({
    id: '',
    messages: [INITIAL_MESSAGE],
    urgencyLevel: 'LOW',
    triageComplete: false,
    startedAt: new Date(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Build conversation history for Gemini (excludes system messages)
  const getGeminiHistory = useCallback(() => {
    // Get all messages except the initial greeting and current last message
    const allMessages = session.messages.filter(
      (m) =>
        m.id !== 'init-0' &&
        m.role !== 'system' &&
        m.content &&
        m.content.trim() !== ''
    );

    // Don't include the very last message - it's sent as the current userMessage
    const historyMessages = allMessages.slice(0, -1);

    if (historyMessages.length === 0) return [];

    // Build properly alternating history for Gemini
    const result: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    
    for (const msg of historyMessages) {
      const role = msg.role === 'user' ? 'user' as const : 'model' as const;
      // Avoid consecutive same roles which breaks Gemini
      if (result.length > 0 && result[result.length - 1].role === role) {
        // Merge with previous message
        result[result.length - 1].parts[0].text += '\n' + msg.content.trim();
      } else {
        result.push({ role, parts: [{ text: msg.content.trim() }] });
      }
    }

    // Gemini history must start with a user message
    if (result.length > 0 && result[0].role === 'model') {
      result.shift();
    }

    return result;
  }, [session.messages]);

  const sendMessage = useCallback(
    async (content: string, imageBase64?: string) => {
      if (!content.trim() && !imageBase64) return;
      if (isLoading) return;

      // Add user message to state immediately
      // If imageBase64 is provided, we'll store a preview URL
      const previewUrl = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined;
      
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        metadata: previewUrl ? { imageUrl: previewUrl } : undefined,
      };

      setSession((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));
      setInputValue('');
      setIsLoading(true);

      try {
        abortRef.current = new AbortController();

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            sessionId: session.id || undefined,
            imageBase64,
            conversationHistory: (() => {
              const allMessages = session.messages.filter(
                (m) =>
                  m.id !== 'init-0' &&
                  m.role !== 'system' &&
                  m.content &&
                  m.content.trim() !== ''
              );
              const result: Array<{ role: 'user' | 'assistant'; content: string }> = [];
              for (const msg of allMessages) {
                const role = msg.role === 'user' ? 'user' as const : 'assistant' as const;
                if (result.length > 0 && result[result.length - 1].role === role) {
                  result[result.length - 1].content += '\n' + msg.content.trim();
                } else {
                  result.push({ role, content: msg.content.trim() });
                }
              }
              if (result.length > 0 && result[0].role === 'assistant') result.shift();
              return result;
            })(),
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error('Chat API error');

        const data = await response.json();

        const assistantMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
          metadata: {
            urgencyLevel: data.urgencyLevel,
            recommendedMedicines: data.recommendedMedicines,
          },
        };

        setSession((prev) => ({
          ...prev,
          id: data.sessionId || prev.id,
          messages: [...prev.messages, assistantMessage],
          urgencyLevel: data.urgencyLevel,
          triageComplete: data.triageComplete,
        }));

        setQuestionIndex((i) => Math.min(i + 1, TRIAGE_QUESTIONS.length - 1));
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const errorMessage: Message = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ I encountered an error. Please try again. If this is an emergency, call 911.',
          timestamp: new Date(),
        };
        setSession((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, session.id, getGeminiHistory]
  );

  const resetSession = useCallback(() => {
    abortRef.current?.abort();
    setSession({
      id: '',
      messages: [INITIAL_MESSAGE],
      urgencyLevel: 'LOW',
      triageComplete: false,
      startedAt: new Date(),
    });
    setInputValue('');
    setQuestionIndex(0);
    setIsLoading(false);
  }, []);

  return {
    session,
    isLoading,
    inputValue,
    setInputValue,
    sendMessage,
    resetSession,
    questionIndex,
    totalQuestions: TRIAGE_QUESTIONS.length,
  };
}

