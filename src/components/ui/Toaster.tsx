'use client';

import { useEffect, useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastListeners: Array<(toast: Omit<Toast, 'id'>) => void> = [];

export function toast(message: string, type: Toast['type'] = 'info') {
  toastListeners.forEach((listener) => listener({ message, type }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Omit<Toast, 'id'>) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, ...t }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((p) => p.id !== id));
      }, 4000);
    };
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-slide-up 
            ${t.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-200' : ''}
            ${t.type === 'error' ? 'bg-red-900/90 border-red-500/30 text-red-200' : ''}
            ${t.type === 'info' ? 'bg-slate-800/90 border-slate-500/30 text-slate-200' : ''}
          `}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
