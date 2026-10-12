"use client";

import { useCallback, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useCamera } from "@/hooks/useCamera";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import CameraView from "@/components/video/CameraView";
import MedicinePanel from "@/components/medicines/MedicinePanel";
import { RefreshCcw, Pill, X } from "lucide-react";

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
  const [medicinePanelOpen, setMedicinePanelOpen] = useState(false);

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      setInputValue(text);
    },
    [setInputValue]
  );

  const voice = useVoiceInput(handleVoiceTranscript);

  const handleSend = useCallback(
    (text: string, imageBase64?: string) => {
      const frame = camera.isActive ? camera.captureFrame() : undefined;
      sendMessage(text, frame ?? imageBase64);
    },
    [camera, sendMessage]
  );

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await sendMessage(
          inputValue || "Please analyze this medicine or symptom photo.",
          base64
        );
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [sendMessage, inputValue]
  );

  const handleCaptureAnalyze = useCallback(async () => {
    const analysis = await camera.analyzeCurrentFrame(
      inputValue || "Patient is showing something on camera."
    );
    if (analysis) {
      setInputValue((prev) => (prev ? prev + "\n\n[Camera]: " + analysis : "[Camera]: " + analysis));
    }
  }, [camera, inputValue, setInputValue]);

  const progressPct = Math.round((questionIndex / totalQuestions) * 100);

  return (
    <div className="max-w-6xl mx-auto h-full flex gap-4 px-4" style={{ height: "calc(100vh - 8rem)" }}>
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
                style={{ width: progressPct + "percent" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setMedicinePanelOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-navy hover:bg-gray-100 transition-colors"
              aria-label="Open medicine panel"
            >
              <Pill className="w-5 h-5" />
            </button>
            <button
              onClick={resetSession}
              className="ml-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

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

        <ChatWindow
          messages={session.messages}
          urgencyLevel={session.urgencyLevel}
          isLoading={isLoading}
        />

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

      {/* RIGHT: Medicine Panel - Desktop */}
      <div className="hidden lg:block w-80 py-4 overflow-y-auto border-l border-gray-200">
        <MedicinePanel />
      </div>

      {/* Mobile Medicine Panel Drawer */}
      {medicinePanelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMedicinePanelOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed right-0 top-0 z-50 w-full max-w-sm h-full bg-white shadow-floating border-l border-gray-200 animate-slide-in md:hidden"
            role="dialog"
            aria-label="Medicine panel"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Medicine Lookup</h2>
              <button
                onClick={() => setMedicinePanelOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close medicine panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div style={{ overflow: "auto", maxHeight: "calc(100vh - 120px)" }}>
              <MedicinePanel />
            </div>
          </aside>
        </>
      )}

    </div>
  );
}
