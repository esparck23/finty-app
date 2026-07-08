**STATE — Finty**

**Etapa actual: 4/7 — Dashboard Avanzado + Transparencia (REABIERTA por feedback 7 / DEC-017)
Última sesión: 2026-07-08
Commit: 3be5bb0 (rama agentpc-dev)
Salud: 🟢 verde
Próxima acción: Merge de agentpc-dev a main tras gate humano (PR #5 ya abierto para DEC-016; DEC-017 va en el mismo o nuevo PR). Luego Etapa 5 (PWA) con aprobación.
Bloqueos activos: ninguno (BLK-003 resuelto por Qwen).
Nota: PR #5 (DEC-016) abierto sin mergear. DEC-017 implementado en agentpc-dev (Qwen): tabla /transparencia pagina el 100% de transacciones vía /api/public/transactions; cards Bs móvil sin desborde. No avanzar a Etapa 5 hasta gate humano.
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
