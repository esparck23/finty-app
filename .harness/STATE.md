**STATE — Finty**

**Etapa actual: 0/7 — Harness de Tests (EN CURSO, arrancada 2026-07-08)
Última sesión: 2026-07-08
Commit: b09de82 (main) — rama de trabajo: agentpc-dev
Salud: 🟡 en progreso (BLK-001 resuelto vía migración a Jest)
Próxima acción: Qwen limpia Vitest y prepara Jest (DEC-018) en agentpc-dev; revisión humana antes de mergear a main.
Bloqueos: BLK-001 (Vitest/Windows) resuelto por decisión DEC-018 de usar Jest.
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
Tests: Etapa 0 EN CURSO. DEC-010 descarta Vitest en Windows; DEC-018 migra a Jest (ejecutado por Qwen).

**Decisiones recientes**
- DEC-008 a DEC-017: feedbacks 1-7 de Etapa 4 (ver DECISIONS.md)
- DEC-016: punto de verdad /transparencia = Transacciones (split v5 de exchange)
- DEC-017: paginación tabla al 100% + cards Bs móvil (Qwen resolvió BLK-003)
- DEC-018: arranque Etapa 0 con Jest (Qwen limpia Vitest + prepara Jest)

**Agentes coding utilizados**
- Qoder: DEC-012 a DEC-016 (falló DEC-017 por timeout + rate limit)
- Qwen: DEC-017 (resolvió BLK-003); DEC-018 (Etapa 0, Jest)

Links
Vercel: https://finty-nu.vercel.app
GitHub: https://github.com/esparck23/finty-app.git
