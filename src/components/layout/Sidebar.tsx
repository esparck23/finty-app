'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Tags, 
  FileText, 
  Shield, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Globe
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopExpanded: boolean;
  setIsDesktopExpanded: (expanded: boolean) => void;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen, isDesktopExpanded, setIsDesktopExpanded }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, enabled: true },
    { name: 'Transacciones', href: '/transactions', icon: ArrowLeftRight, enabled: true },
    { name: 'Categorías', href: '/categories', icon: Tags, enabled: true },
    { name: 'Transparencia', href: '/transparencia', icon: Globe, enabled: true },
    { name: 'Reportes', href: '/reports', icon: FileText, enabled: false },
    { name: 'Auditoría', href: '/audit', icon: Shield, enabled: false },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-950 border-r border-white/10 text-slate-300">
      <div className="flex items-center justify-between p-4 h-16 border-b border-white/10">
        {(isDesktopExpanded || isMobileOpen) && (
          <span className="font-bold text-xl text-white tracking-wide">Finty</span>
        )}
        {!isMobileOpen && (
          <button 
            onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden md:block ml-auto"
            title={isDesktopExpanded ? "Colapsar menú" : "Expandir menú"}
          >
            {isDesktopExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          if (!item.enabled) {
            return (
              <div 
                key={item.name} 
                className={`flex items-center px-3 py-2.5 rounded-lg text-slate-600 opacity-50 cursor-not-allowed ${!isDesktopExpanded && !isMobileOpen ? 'justify-center' : ''}`}
                title={`${item.name} (Próximamente)`}
              >
                <Icon size={20} className="shrink-0" />
                {(isDesktopExpanded || isMobileOpen) && <span className="ml-3 font-medium">{item.name}</span>}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => isMobileOpen && setIsMobileOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600/20 text-blue-400' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              } ${!isDesktopExpanded && !isMobileOpen ? 'justify-center' : ''}`}
              title={!isDesktopExpanded && !isMobileOpen ? item.name : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {(isDesktopExpanded || isMobileOpen) && <span className="ml-3 font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${!isDesktopExpanded && !isMobileOpen ? 'justify-center' : ''}`}
          title={!isDesktopExpanded && !isMobileOpen ? 'Cerrar Sesión' : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {(isDesktopExpanded || isMobileOpen) && <span className="ml-3 font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'} 
          md:translate-x-0 md:static ${isDesktopExpanded ? 'md:w-64' : 'md:w-[72px]'} shrink-0`}
      >
        <NavContent />
      </aside>
    </>
  );
}
