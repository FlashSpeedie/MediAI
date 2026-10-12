'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { createWorker, OEM, PSM } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export interface OCRState {
  isLoading: boolean;
  progress: number;
  status: string;
  result: OCRResult | null;
  error: string | null;
  workerReady: boolean;
}

export function useOCR() {
  const [state, setState] = useState<OCRState>({
    isLoading: false,
    progress: 0,
    status: '',
    result: null,
    error: null,
    workerReady: false,
  });
  const workerRef = useRef<Awaited<ReturnType<typeof createWorker>> | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    let mounted = true;
    
    const initWorker = async () => {
      try {
        setState(prev => ({ ...prev, status: 'Loading OCR engine...', progress: 0 }));
        const worker = await createWorker('eng', 1, {
          logger: (m) => {
            if (!mounted) return;
            if (m.status === 'recognizing text') {
              setState(prev => ({ 
                ...prev, 
                progress: Math.round(m.progress * 100),
                status: `Recognizing text... ${Math.round(m.progress * 100)}%`
              }));
            } else if (m.status === 'loading tesseract core') {
              setState(prev => ({ ...prev, status: 'Loading core...' }));
            } else if (m.status === 'initializing tesseract') {
              setState(prev => ({ ...prev, status: 'Initializing...' }));
            } else if (m.status === 'loading language traineddata') {
              setState(prev => ({ ...prev, status: 'Loading language data...' }));
            }
          },
        });
        
        await worker.setParameters({
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          tessedit_pageseg_mode: PSM.AUTO,
          preserve_interword_spaces: '1',
        });
        
        workerRef.current = worker;
        
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            workerReady: true, 
            status: 'Ready',
            progress: 100 
          }));
        }
      } catch (err) {
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            error: err instanceof Error ? err.message : 'Failed to initialize OCR',
            workerReady: false 
          }));
        }
      }
    };
    
    initWorker();
    
    return () => {
      mounted = false;
      if (workerRef.current) {
        workerRef.current.terminate().catch(console.error);
        workerRef.current = null;
      }
    };
  }, []);

  const recognize = useCallback(async (imageSource: string | HTMLImageElement | HTMLCanvasElement | File): Promise<OCRResult | null> => {
    if (!workerRef.current || !state.workerReady) {
      setState(prev => ({ ...prev, error: 'OCR worker not ready' }));
      return null;
    }
    
    if (state.isLoading) return null;
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      progress: 0, 
      status: 'Starting OCR...',
      error: null,
      result: null 
    }));
    
    try {
      const { data } = await workerRef.current.recognize(imageSource);
      
      // Tesseract.js v5 returns data with words and lines properties
      const pageData = data as { 
        text: string; 
        confidence: number; 
        words?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }>;
        lines?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }>;
      };
      
      const result: OCRResult = {
        text: pageData.text,
        confidence: pageData.confidence,
        words: (pageData.words || []).map(w => ({
          text: w.text,
          confidence: w.confidence,
          bbox: w.bbox,
        })),
        lines: (pageData.lines || []).map(l => ({
          text: l.text,
          confidence: l.confidence,
          bbox: l.bbox,
        })),
      };
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        progress: 100, 
        status: 'Complete',
        result,
        error: null 
      }));
      
      return result;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err instanceof Error ? err.message : 'OCR failed',
        progress: 0,
        status: 'Error'
      }));
      return null;
    }
  }, [state.isLoading, state.workerReady]);

  const reset = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      result: null, 
      error: null, 
      progress: 0, 
      status: '',
      isLoading: false 
    }));
  }, []);

  const terminate = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
      setState(prev => ({ ...prev, workerReady: false }));
    }
  }, []);

  return {
    ...state,
    recognize,
    reset,
    terminate,
  };
}