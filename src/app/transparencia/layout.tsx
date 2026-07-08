import { getAuthUser } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';

export default async function TransparenciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (user) {
    return <AppShell>{children}</AppShell>;
  }

  return <div className="min-h-screen">{children}</div>;
}
