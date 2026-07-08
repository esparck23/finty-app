**STATE — Finty**

**Etapa actual: 4/7 — Dashboard Avanzado + Transparencia (REABIERTA por feedback 7 / DEC-017)
Última sesión: 2026-07-07
Commit: ec0d783 (rama agentpc-dev)
Salud: 🟢 verde
Próxima acción: Corregir DEC-017 (paginación tabla /transparencia al 100%, cards Bs en móvil) en agentpc-dev; NO mergear aún, esperar revisión.
Bloqueos activos: BLK-002 (registro resuelto).
Nota: PR #5 (DEC-016) abierto sin mergear. DEC-017 abre ajustes post-preview. No avanzar a Etapa 5 hasta cerrar y gate humano.
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
