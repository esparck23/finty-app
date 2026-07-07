**STATE — Finty**

**Etapa actual: 5/7 — Modo Offline (PWA)
Última sesión: 2026-07-07
Commit: (ver git log)
Salud: 🟢 verde
Próxima acción: Iniciar Etapa 5 — PWA offline con Service Worker
Bloqueos activos: ninguno
No tocar:
trg_audit_delete — dropeado permanentemente (conflicto FK). Audit DELETE va desde código.
Modelo de Balance — v5 es el definitivo. No revertir a v6.
receipt_url — existe en schema pero sin poblar. No construir UI hasta decidir almacenamiento.
middleware.ts — Next.js 16 usa proxy.ts. No crear middleware.


**Contexto rápido
Stack: Next.js 16 + TypeScript + TailwindCSS + Turso (SQLite) + Vercel
Auth: Contraseña bcrypt → cookie HttpOnly 24h (sin JWT)
IA: Gemini 2.5 Flash OCR directo (sin R2, sin gateway aún)
Tasas: Cotizave primario, dolar-bcv-api fallback
Tests: Ninguno. Etapa 0 pendiente.

Links
Vercel: https://finty-nu.vercel.app
GitHub: https://github.com/esparck23/finty-app.git