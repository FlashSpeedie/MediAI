// src/hooks/useCamera.ts
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { CameraState } from '@/types';

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    isActive: false,
    stream: null,
    error: null,
    isAnalyzing: false,
    lastAnalysis: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState((prev) => ({
        ...prev,
        isActive: true,
        stream,
        error: null,
      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Camera access denied';
      setState((prev) => ({ ...prev, error, isActive: false }));
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({
      ...prev,
      isActive: false,
      stream: null,
    }));
  }, []);

  const toggleCamera = useCallback(() => {
    if (state.isActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [state.isActive, startCamera, stopCamera]);

  // Capture a single frame as base64 JPEG
  const captureFrame = useCallback(
    (quality = 0.8): string | null => {
      if (!videoRef.current || !state.isActive) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoRef.current, 0, 0);
      // Return base64 WITHOUT the data: prefix
      return canvas.toDataURL('image/jpeg', quality).split(',')[1];
    },
    [state.isActive]
  );

  // Analyze the current camera frame via API
  const analyzeCurrentFrame = useCallback(
    async (context: string): Promise<string | null> => {
      const frame = captureFrame();
      if (!frame) return null;

      setState((prev) => ({ ...prev, isAnalyzing: true }));
      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: frame,
            mimeType: 'image/jpeg',
            context,
          }),
        });
        const data = await response.json();
        const analysis = data.analysis ?? 'No analysis available.';
        setState((prev) => ({ ...prev, lastAnalysis: analysis, isAnalyzing: false }));
        return analysis;
      } catch {
        setState((prev) => ({ ...prev, isAnalyzing: false }));
        return null;
      }
    },
    [captureFrame]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    toggleCamera,
    captureFrame,
    analyzeCurrentFrame,
  };
}
