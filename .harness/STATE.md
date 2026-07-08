**STATE — Finty**

**Etapa actual: 4/7 — Dashboard Avanzado + Transparencia (COMPLETADA)
Última sesión: 2026-07-08
Commit: 62dcf1c (main, merge PR #5)
Salud: 🟢 verde
Próxima acción: Etapa 5 — Modo Offline (PWA) con Serwist + IndexedDB, tras gate de aprobación humana.
Bloqueos activos: ninguno (BLK-001 Vitest pendiente en Etapa 0; BLK-003 resuelto por Qwen).
Cierre de Etapa 4: todos los feedbacks 1-7 atendidos y mergeados a main (PR #3 DEC-012/013, PR #4 DEC-014/015, PR #5 DEC-016/017). Punto de verdad /transparencia alineado a Transacciones (v5). Tabla pagina el 100% de transacciones. Cards Bs móvil sin desborde.
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
- DEC-012 a DEC-017: feedbacks 2-7 de Etapa 4 (ver DECISIONS.md)
- DEC-016: punto de verdad /transparencia = Transacciones (split v5 de exchange)
- DEC-017: paginación tabla al 100% + cards Bs móvil (Qwen resolvió BLK-003)

**Agentes coding utilizados**
- Qoder: DEC-012 a DEC-016 (falló DEC-017 por timeout + rate limit)
- Qwen: DEC-017 (resolvió BLK-003 cuando Qoder estaba en rate limit)

Links
Vercel: https://finty-nu.vercel.app
GitHub: https://github.com/esparck23/finty-app.git
