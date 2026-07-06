'use client';

import { useState, useCallback } from 'react';
import type { ScanResult } from '@/types/gemini';
import { compressImage } from '@/lib/utils/compressImage';

type ScanStatus = 'idle' | 'compressing' | 'uploading' | 'scanning' | 'done' | 'error';

interface UseScannerReturn {
  status: ScanStatus;
  progress: string;
  result: ScanResult | null;
  preview: string | null;
  error: string | null;
  scan: (file: File) => Promise<void>;
  reset: () => void;
}

export function useScanner(): UseScannerReturn {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress('');
    setResult(null);
    setPreview(null);
    setError(null);
  }, []);

  const scan = useCallback(async (file: File) => {
    reset();
    try {
      // Crear preview de la imagen antes de procesar
      setPreview(URL.createObjectURL(file));

      setStatus('compressing');
      setProgress('Comprimiendo imagen...');

      // Comprimir imagen
      const compressed = await compressImage(file);

      setStatus('uploading');
      setProgress('Enviando a IA...');

      // Crear FormData y enviar
      const formData = new FormData();
      formData.append('file', compressed, 'receipt.jpg');

      setStatus('scanning');
      setProgress('Analizando comprobante...');

      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error al escanear');
      }

      setResult(json.data);
      setStatus('done');
      setProgress('Listo');
    } catch (err: any) {
      const message = err?.message || 'Error desconocido';
      setError(message);
      setStatus('error');
      setProgress('Error');
    }
  }, [reset]);

  return {
    status,
    progress,
    result,
    preview,
    error,
    scan,
    reset,
  };
}
