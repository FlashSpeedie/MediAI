// src/app/chat/page.tsx
'use client';
import { useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { useCamera } from '@/hooks/useCamera';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import CameraView from '@/components/video/CameraView';
import MedicinePanel from '@/components/medicines/MedicinePanel';
import { RefreshCcw } from 'lucide-react';

export default function ChatPage() {
  const {
    session,
    isLoading,
    inputValue,
    setInputValue,
    sendMessage,
    resetSession,
    questionIndex,
    totalQuestions,
  } = useChat();

  const camera = useCamera();

  // When voice transcript arrives, set it as input value
  const handleVoiceTranscript = useCallback(
    (text: string) => {
      setInputValue(text);
    },
    [setInputValue]
  );

  const voice = useVoiceInput(handleVoiceTranscript);

  // Send a message with optional camera frame or image
  const handleSend = useCallback(
    (text: string, imageBase64?: string) => {
      const frame = camera.isActive ? camera.captureFrame() : undefined;
      sendMessage(text, frame ?? imageBase64);
    },
    [camera, sendMessage]
  );

  // Handle image upload from file input
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Send with image to API
        await sendMessage(
          inputValue || 'Please analyze this medicine or symptom photo.',
          base64
        );
      };
      reader.readAsDataURL(file);
      
      // Reset input so same file can be uploaded again
      e.target.value = '';
    },
    [sendMessage, inputValue]
  );

  // Capture + analyze current camera frame and inject as message
  const handleCaptureAnalyze = useCallback(async () => {
    const analysis = await camera.analyzeCurrentFrame(
      inputValue || 'Patient is showing something on camera.'
    );
    if (analysis) {
      setInputValue((prev: string) => prev ? `${prev}\n\n[Camera]: ${analysis}` : `[Camera]: ${analysis}`);
    }
  }, [camera, inputValue, setInputValue]);

  // Progress bar
  const progressPct = Math.round((questionIndex / totalQuestions) * 100);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex gap-4 px-4">
      
      {/* LEFT: Chat column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Triage Progress</span>
              <span className="text-xs font-medium text-gray-600">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <button
            onClick={resetSession}
            className="ml-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Camera view (conditionally shown) */}
        {camera.isActive && (
          <div className="px-4 pt-3">
            <CameraView
              videoRef={camera.videoRef}
              isActive={camera.isActive}
              isAnalyzing={camera.isAnalyzing}
              error={camera.error}
              lastAnalysis={camera.lastAnalysis}
            />
          </div>
        )}

        {/* Messages */}
        <ChatWindow
          messages={session.messages}
          urgencyLevel={session.urgencyLevel}
          isLoading={isLoading}
        />

        {/* Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          onCaptureFrame={camera.isActive ? handleCaptureAnalyze : undefined}
          onImageUpload={handleImageUpload}
          isLoading={isLoading}
          isListening={voice.isListening}
          isCameraActive={camera.isActive}
          isVoiceSupported={voice.isSupported}
          onVoiceToggle={voice.toggleListening}
          onCameraToggle={camera.toggleCamera}
        />
      </div>

      {/* RIGHT: Medicine Panel — desktop only */}
      <div className="hidden lg:block w-80 py-4 overflow-y-auto">
        <MedicinePanel />
      </div>

    </div>
  );
}
