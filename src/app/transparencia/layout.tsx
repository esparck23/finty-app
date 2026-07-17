import { AppShell } from '@/components/layout/AppShell';

export default function TransparenciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bug 3 (5.9): siempre usar AppShell. El menú (Sidebar) se muestra u
  // oculta según auth del usuario resuelto en el cliente (useAuthStatus).
  // Así el menú persiste al navegar entre módulos (no se pierde por el SW
  // sirviendo una versión server cacheada sin AppShell).
  return <AppShell>{children}</AppShell>;
}
