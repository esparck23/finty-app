**STATE — Finty**

**Etapa actual: 5/7 — Modo Offline (PWA) — EN PROGRESO**
Última sesión: 2026-07-10
Commit: agentpc-dev (SW base completada)
Salud: 🟢 verde

Próxima acción: 5.2 — IndexedDB offline queue
  a. Archivo: src/lib/offline/db.ts
  b. Scope: store transacciones creadas offline con flag is_offline_sync=0
  c. Criterio medible: test unitario (Jest) que inserta y lee un registro offline; build verde.
  
Bloqueos: BLK-001 resuelto (Jest). BLK-003 resuelto (Qwen completó DEC-017). BLK-004 resuelto (Qwen API error; Hermes terminó DEC-018).
Cierre Etapa 4: COMPLETADA y mergeada (PR #3, #4, #5). Feedback 1-7 atendidos.
No tocar:
- trg_audit_delete — dropeado permanentemente (conflicto FK). Audit DELETE desde código.
- Modelo de Balance — v5 es el definitivo. No revertir a v6.
- receipt_url — existe en schema pero sin poblar. No construir UI hasta decidir almacenamiento.

**Contexto rápido**
Stack: Next.js 16 + TypeScript + TailwindCSS + Turso (SQLite) + Recharts 3.9.2 + Vercel
Auth: Contraseña bcrypt → cookie HttpOnly 24h (sin JWT)
IA: Gemini 2.5 Flash OCR directo (sin gateway aún)
Tasas: Cotizave primario, dolar-bcv-api fallback
Tests: Etapa 0 COMPLETADA.

**Decisiones recientes**
- DEC-018: arranque Etapa 0 con Jest (Vitest eliminado, jest.config.ts + currency.test.ts, npm test pasa 4/4)

**Agentes coding utilizados**
- Qoder: DEC-012→DEC-016 (falló DEC-017)
- Qwen: DEC-017 (OK); DEC-018 (falló por API, Hermes terminó)

Links
Vercel: https://finty-nu.vercel.app
GitHub: https://github.com/esparck23/finty-app.git
