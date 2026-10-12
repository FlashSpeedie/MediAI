// src/lib/gemini-live.ts
// NOTE: Gemini Live API uses WebSockets for real-time streaming
// This module manages the WebSocket connection client-side
// The actual WebSocket connection is opened FROM THE BROWSER (client component)

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  onMessage: (text: string) => void;
  onError: (error: Error) => void;
  onStatusChange: (status: LiveConnectionStatus) => void;
}

export type LiveConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'error';

export interface LiveMessage {
  type: 'text' | 'video_frame' | 'audio';
  content: string;      // text string or base64 for media
  mimeType?: string;
}

// WebSocket endpoint for Gemini Live API
// NOTE: As of 2024/2025, Gemini Live is available through the Multimodal Live API
// Check https://ai.google.dev/api/multimodal-live for latest endpoint
const GEMINI_LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private config: GeminiLiveConfig;
  private status: LiveConnectionStatus = 'disconnected';
  private frameInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.setStatus('connecting');
    const url = `${GEMINI_LIVE_WS_URL}?key=${this.config.apiKey}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.setStatus('connected');
      // Send setup message
      this.sendSetup();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        // Handle different response types
        if (data.serverContent?.modelTurn?.parts) {
          const text = data.serverContent.modelTurn.parts
            .filter((p: { text?: string }) => p.text)
            .map((p: { text: string }) => p.text)
            .join('');
          if (text) this.config.onMessage(text);
        }
      } catch (e) {
        console.error('Gemini Live parse error:', e);
      }
    };

    this.ws.onerror = () => {
      this.setStatus('error');
      this.config.onError(new Error('WebSocket connection error'));
    };

    this.ws.onclose = () => {
      this.setStatus('disconnected');
      this.stopFrameCapture();
    };
  }

  private sendSetup(): void {
    if (!this.ws) return;
    const setupMessage = {
      setup: {
        model: `models/${this.config.model ?? 'gemini-2.0-flash-live-001'}`,
        generation_config: {
          response_modalities: ['TEXT'],
          temperature: 0.4,
        },
        system_instruction: {
          parts: [{ text: this.config.systemInstruction ?? 'You are a helpful medical AI assistant.' }],
        },
      },
    };
    this.ws.send(JSON.stringify(setupMessage));
  }

  sendTextMessage(text: string): void {
    if (!this.ws || this.status !== 'connected') return;
    const message = {
      client_content: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turn_complete: true,
      },
    };
    this.ws.send(JSON.stringify(message));
  }

  // Send a single video frame for analysis
  sendVideoFrame(base64Frame: string): void {
    if (!this.ws || this.status !== 'connected') return;
    const message = {
      realtime_input: {
        media_chunks: [
          {
            data: base64Frame,
            mime_type: 'image/jpeg',
          },
        ],
      },
    };
    this.ws.send(JSON.stringify(message));
  }

  // Start streaming frames from a video element at given interval (ms)
  startFrameCapture(videoElement: HTMLVideoElement, intervalMs = 2000): void {
    this.stopFrameCapture();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    this.frameInterval = setInterval(() => {
      if (!videoElement.videoWidth || !ctx) return;
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);
      // Get base64 without the data: prefix
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      this.sendVideoFrame(base64);
    }, intervalMs);
  }

  stopFrameCapture(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
  }

  disconnect(): void {
    this.stopFrameCapture();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  getStatus(): LiveConnectionStatus {
    return this.status;
  }

  private setStatus(status: LiveConnectionStatus): void {
    this.status = status;
    this.config.onStatusChange(status);
  }
}

