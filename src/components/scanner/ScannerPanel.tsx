'use client';

import { useRef, useCallback } from 'react';
import { useScanner } from '@/hooks/useScanner';
import { ScanResultView } from './ScanResultView';
import type { ScanResult } from '@/types/gemini';

interface ScannerPanelProps {
  onApply: (result: ScanResult, type: 'income' | 'expense') => void;
  onCancel: () => void;
}

export function ScannerPanel({ onApply, onCancel }: ScannerPanelProps) {
  const { status, progress, result, preview, error, scan, reset } = useScanner();
  const fileRef = useRef<HTMLInputElement>(null);

  const isIdle = status === 'idle';
  const isProcessing = status === 'compressing' || status === 'uploading' || status === 'scanning';
  const isDone = status === 'done' && result;
  const isError = status === 'error';

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        scan(file);
      }
      // Resetear el input para permitir seleccionar el mismo archivo nuevamente
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    },
    [scan]
  );

  return (
    <div className="space-y-4">
      {/* Input de archivo oculto */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Estado: En espera */}
      {isIdle && (
        <div className="card-glass p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-600/20 rounded-full flex items-center justify-center text-3xl">
            📸
          </div>
          <div>
            <p className="text-lg font-medium text-white">Tomar foto o subir comprobante</p>
            <p className="text-sm text-slate-400 mt-1">
              La IA extraerá los datos automáticamente
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-primary w-full"
          >
            📷 Abrir cámara o galería
          </button>
        </div>
      )}

      {/* Estado: Procesando */}
      {isProcessing && (
        <div className="card-glass p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto animate-spin">
            ⏳
          </div>
          <p className="text-slate-300 font-medium">{progress}</p>
          {preview && (
            <div className="w-full max-h-48 overflow-hidden rounded-lg">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain opacity-80"
              />
            </div>
          )}
        </div>
      )}

      {/* Estado: Error */}
      {isError && (
        <div className="card-glass p-6 space-y-4 border-red-500/30">
          <div className="w-12 h-12 mx-auto bg-red-600/20 rounded-full flex items-center justify-center text-2xl">
            ❌
          </div>
          <div className="text-center">
            <p className="text-red-400 font-medium">Error al escanear</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="btn-primary flex-1"
            >
              🔄 Intentar de nuevo
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-danger flex-1"
            >
              ✏️ Llenar manual
            </button>
          </div>
        </div>
      )}

      {/* Estado: Completado */}
      {isDone && (
        <ScanResultView
          result={result}
          preview={preview}
          onApply={(type) => onApply(result, type)}
          onRescan={reset}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}
