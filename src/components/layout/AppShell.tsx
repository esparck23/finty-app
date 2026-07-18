'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Toaster } from '@/components/ui/Toaster';
import { useAuthStatus } from '@/hooks/useAuthStatus';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const { isAuthenticated, loading } = useAuthStatus();

  // Mientras se resuelve la sesión, mostrar spinner para evitar
  // race condition: si renderizamos !isAuthenticated antes de que
  // el fetch de /api/auth/me termine, el router entra en estado incoherente.
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Bug 3 (5.9): el menú (Sidebar) solo se muestra si el usuario está
  // autenticado. Quien no hace login no ve el menú.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300">
        {children}
        <Toaster />
      </div>
    );
  }


  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-300">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen}
        isDesktopExpanded={isDesktopExpanded}
        setIsDesktopExpanded={setIsDesktopExpanded}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Topbar */}
        <header className="md:hidden h-16 border-b border-white/10 flex items-center px-4 shrink-0 bg-slate-950">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <span className="ml-3 font-bold text-lg text-white">Finty</span>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
