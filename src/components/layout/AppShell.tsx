'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Toaster } from '@/components/ui/Toaster';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);

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
