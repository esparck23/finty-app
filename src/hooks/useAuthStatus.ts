'use client';

import { useEffect, useState } from 'react';

interface AuthUser {
  id: string;
  fullName: string;
  role: string;
}

/**
 * Bug 3 (5.9): resuelve en el cliente si el usuario está autenticado,
 * para que el AppShell decida mostrar u ocultar el menú (Sidebar).
 * Consulta /api/auth/me una vez al montar.
 */
export function useAuthStatus() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((json) => {
        if (active) setUser(json.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { user, isAuthenticated: !!user, loading };
}
