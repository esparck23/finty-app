**STATE — Finty**

**Etapa actual: 5/7 — Modo Offline (PWA) ✅ COMPLETADA**
Última sesión: 2026-07-14
Commit main: 39e7b3e (PR #12, cierre Etapa 5 + STATE limpio)
Salud: 🟢 verde
Próxima acción: Etapa 6 — Automatización de Reportes (API /api/reports, PDF CSV, GitHub Action semanal)
Bloqueos activos: ninguno (BLK-005/006/007/008 ✅ resueltos)
No tocar:
- trg_audit_delete — dropeado permanentemente (conflicto FK). Audit DELETE desde código.
- Modelo de Balance — v5 es el definitivo. No revertir a v6.
- receipt_url — existe en schema pero sin poblar. No construir UI hasta decidir almacenamiento.
- middleware.ts — Next.js 16 usa proxy.ts. No crear middleware.

**Cierre Etapa 5 (sub-pasos)**
- 5.1 Service Worker base (Serwist): sw.ts + sw-register.tsx, intercepta GET /api/categories y /api/transactions. sw.test.ts (Jest).
- 5.2 IndexedDB offline queue: src/lib/offline/db.ts + db.test.ts.
- 5.3 Background sync: sync en sw.ts + src/lib/offline/sync.test.ts + syncOfflineTransactions en db.ts.
- 5.4 Manifest + iconos: Next.js Metadata Files (manifest.ts, icon.tsx, apple-icon.tsx, icons/[size]/route.tsx). Instalable.
- 5.5 Verificación Cache Storage: checklist manual en JOURNAL (Chrome DevTools → Application → Cache Storage confirma /api/categories y /api/transactions cacheados bajo 'api-cache-v1'). Build verde.
  - MICRO-PASO FOCO (motor A2A Factory): verificar que el SW cachea efectivamente GET /api/categories y GET /api/transactions. Criterio: tras navegar online y revisar Cache Storage, ambas rutas presentes en 'api-cache-v1' (NetworkFirst). Si no aparecen, el matcher del SW (runtimeCaching en sw.ts) es el punto a corregir antes de 5.6.
- Verificación: npm test (Jest) 17 passed; npm run build rc 0.

**Contexto rápido**
Stack: Next.js 16 + TypeScript + TailwindCSS + Turso (SQLite) + Recharts 3.9.2 + Serwist 9.5.11 + Jest 30 + Vercel
Auth: Contraseña bcrypt → cookie HttpOnly 24h (sin JWT)
IA: Gemini 2.5 Flash OCR directo (sin R2, sin gateway aún)
Tasas: Cotizave primario, dolar-bcv-api fallback
Tests: Jest configurado (DEC-018). 17 tests pasando.

**Decisiones recientes**
- DEC-008 a DEC-017: feedbacks 1-7 de Etapa 4
- DEC-018: arranque Etapa 0 con Jest (Vitest descartado por BLK-001)
- DEC-019: 5.2 IndexedDB offline queue
- DEC-022: rama por etapa (cada etapa su propia rama feature/*; no usar agentpc-dev como única)

**Agentes coding utilizados**
- Qoder: DEC-012→DEC-016 (falló DEC-017)
- Qwen: DEC-017 (OK); DEC-018 (falló API, Hermes terminó); motor A2A Factory (5.2/5.3 con limitaciones)
- Pi (externo al motor): 5.1 coverage, 5.4 manifest/icons (evitó binarios PNG)
- Hermes: terminó DEC-018, correcciones BLK-006/007/008 en motor

**Ramas por etapa (DEC-022)**
- Cada etapa usa su PROPIA rama (feat/5.x-...). Tras merge a main, nueva rama para la siguiente etapa.
- PR: rama-de-etapa → main. Reemplaza ciclo recurrente agentpc-dev.
- Force-push de limpieza origin/agentpc-dev: pendiente de aprobación del usuario en UI.

Links
Vercel: https://finty-nu.vercel.app
GitHub: https://github.com/esparck23/finty-app.git
