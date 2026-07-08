**STATE — Finty**

**Etapa actual: 4/7 — Dashboard Avanzado + Transparencia (REABIERTA por feedback 4 / DEC-014)
Última sesión: 2026-07-07
Commit: 77bfaa8 (rama agentpc-dev)
Salud: 🟢 verde
Próxima acción: Merge de agentpc-dev a main tras gate humano (PR pendiente); luego Etapa 5 (PWA) con aprobación.
Bloqueos activos: ninguno
Nota: reabierta tras merge de PR #3 (DEC-013). DEC-014 implementado en agentpc-dev (footer global en layout, select Dashboard alineado, nav /transparencia condicional por auth). Punto 2 aclarado: Dashboard ya tenía control de periodo desde DEC-008/012; DEC-014 solo alineó etiquetas con /transparencia. No avanzar a Etapa 5 hasta gate de aprobación humana.
No tocar:
- trg_audit_delete — dropeado permanentemente (conflicto FK). Audit DELETE desde código.
- Modelo de Balance — v5 es el definitivo. No revertir a v6.
- receipt_url — existe en schema pero sin poblar. No construir UI hasta decidir almacenamiento.
- middleware.ts — Next.js 16 usa proxy.ts. No crear middleware.

**Contexto rápido**
Stack: Next.js 16 + TypeScript + TailwindCSS + Turso (SQLite) + Recharts 3.9.2 + Vercel
Auth: Contraseña bcrypt → cookie HttpOnly 24h (sin JWT)
IA: Gemini 2.5 Flash OCR directo (sin R2, sin gateway aún)
Tasas: Cotizave primario, dolar-bcv-api fallback
Tests: Etapa 0 pendiente. DEC-010 descarta Vitest en Windows; seguir con Jest.

**Decisiones recientes**
- DEC-008: Reapertura Etapa 4 para ajustes dashboard/transparencia
- DEC-009: Una sola card Balance en Dashboard, igual a Transacciones
- DEC-010: Cambio de estrategia de tests a Jest por bloqueo de Vitest/rolldown en Windows
- DEC-011: Vibe marcado como no productivo en Etapa 0 para este proyecto; priorizar Qoder/ejecución directa en setup largo

Links
Vercel: https://finty-nu.vercel.app
GitHub: https://github.com/esparck23/finty-app.git
