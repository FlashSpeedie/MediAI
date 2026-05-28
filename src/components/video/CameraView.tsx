'use client';
import { RefObject } from 'react';
import { Camera, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  isActive: boolean;
  isAnalyzing: boolean;
  error: string | null;
  lastAnalysis: string | null;
}

export default function CameraView({
  videoRef, isActive, isAnalyzing, error, lastAnalysis
}: Props) {
  if (!isActive && !error) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-900 relative">
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-h-64 object-cover"
      />

      {/* Analyzing overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Analyzing…</span>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        {isActive && (
          <span className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 flex items-start gap-2 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Last analysis result */}
      {lastAnalysis && !isAnalyzing && (
        <div className="p-3 bg-blue-50 border-t border-blue-200">
          <p className="text-xs font-semibold text-blue-700 mb-1">🔍 Camera Analysis:</p>
          <p className="text-xs text-blue-600">{lastAnalysis}</p>
        </div>
      )}

      {/* No camera active placeholder */}
      {!isActive && !error && (
        <div className="h-40 flex flex-col items-center justify-center gap-2 text-gray-400">
          <Camera className="w-8 h-8" />
          <p className="text-sm">Camera is off</p>
        </div>
      )}
    </div>
  );
}
