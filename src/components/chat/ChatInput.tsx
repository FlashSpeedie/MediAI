'use client';
import { useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Mic, MicOff, Camera, CameraOff, Loader2, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string, imageBase64?: string) => void;
  onCaptureFrame?: () => void;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  isListening: boolean;
  isCameraActive: boolean;
  isVoiceSupported: boolean;
  onVoiceToggle: () => void;
  onCameraToggle: () => void;
  disabled?: boolean;
}

export default function ChatInput({
  value, onChange, onSend,
  onCaptureFrame, onImageUpload,
  isLoading, isListening, isCameraActive,
  isVoiceSupported, onVoiceToggle, onCameraToggle,
  disabled,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim());
      // Refocus input after send
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3">
      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 text-xs text-brand-600 mb-2 px-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Listening… speak now</span>
        </div>
      )}

      <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
        
        {/* Left side action buttons - horizontal */}
        <div className="flex items-center gap-1 pb-1">
          {/* Voice button */}
          {isVoiceSupported && (
            <button
              onClick={onVoiceToggle}
              disabled={isLoading || disabled}
              title={isListening ? 'Stop listening' : 'Voice input'}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition flex-shrink-0',
                isListening
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50'
              )}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Camera toggle button */}
          <button
            onClick={onCameraToggle}
            disabled={isLoading}
            title={isCameraActive ? 'Turn off camera' : 'Turn on camera'}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition flex-shrink-0',
              isCameraActive
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            )}
          >
            {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          </button>

          {/* Capture frame button - only when camera active */}
          {isCameraActive && onCaptureFrame && (
            <button
              onClick={onCaptureFrame}
              disabled={isLoading}
              title="Analyze current camera frame"
              className="w-8 h-8 rounded-full flex items-center justify-center text-purple-500 hover:bg-purple-50 transition flex-shrink-0 text-sm"
            >
              📸
            </button>
          )}

          {/* Image upload button */}
          {onImageUpload && (
            <label
              title="Upload medicine photo"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition flex-shrink-0 cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
                disabled={isLoading || disabled}
              />
            </label>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 self-center flex-shrink-0" />

        {/* Textarea - grows to fill space */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening… speak now'
              : 'Describe your symptoms…'
          }
          rows={1}
          disabled={disabled || isLoading}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400',
            'focus:outline-none min-h-[36px] max-h-[120px] overflow-y-auto py-1.5',
            (disabled || isLoading) && 'opacity-60 cursor-not-allowed'
          )}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
        />

        {/* Send button - right side */}
        <button
          onClick={handleSend}
          disabled={!value.trim() || isLoading || disabled}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition flex-shrink-0 self-end mb-0.5',
            value.trim() && !isLoading && !disabled
              ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {isLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-1.5 text-center">
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500">Enter</kbd> to send ·
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 ml-1">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}

