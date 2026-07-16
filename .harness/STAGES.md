**STAGES — Finty**

**Etapa 0 — Harness de Tests
Estado: ✅ COMPLETADA
Fecha cierre: 2026-07-08
Commit: agentpc-dev (DEC-018)
Criterios de aceptación:
 Setup de framework de tests (Vitest recomendado → migrado a Jest por BLK-001/DEC-010/DEC-018)
 Al menos 1 test de ejemplo ejecutándose en CI/CD
 Script npm test funcional en package.json
 No romper código existente
Notas: Vitest descartado (tipos Vite rotos en Windows). Jest configurado con @swc/jest + jsdom + alias @/. Test de ejemplo currency.test.ts (4 tests) pasa. Build verde. PR #6 abierto. Falta conectar a CI/CD.
**Etapa 1 — Fundación
Estado: ✅ COMPLETADA
Fecha cierre: 2026-07-03
Criterios de aceptación:
 Next.js 16 + TypeScript + TailwindCSS + App Router + src/
 Esquema SQLite en Turso (users, categories, transactions, exchange_rates, audit_log)
 15 categorías semilla insertadas
 Conexión remota a Turso verificada
 Proxy auth (proxy.ts) protegiendo rutas privadas
 Endpoint POST /api/auth/login con bcrypt + cookie HttpOnly
 Página de login funcional con redirección a /dashboard
Notas: proxy.ts en vez de middleware.ts (Next.js 16). Hash bcrypt en base64 (ADMIN_PASSWORD_HASH_B64).

**Etapa 2 — Núcleo de Transacciones + Categorías + Balance + Tasas
Estado: ✅ COMPLETADA
Fecha cierre: 2026-07-04
Criterios de aceptación:
 Tipos TypeScript + validación Zod (TransactionSchema, CategorySchema)
 CRUD completo de transacciones (GET/POST/PUT/DELETE) con JOIN a categorías
 CRUD de categorías (edición inline, buscador, paginación a 10)
 TransactionForm con selector tipo, moneda dual (USD/Bs), categorías filtradas
 CurrencySelector con raw string state + commit onBlur
 TransactionList con buscador global + paginación a 5
 Dashboard con card Balance doble moneda (solo balance, link a transacciones)
 Cards de resumen (Ingresos/Egresos/Balance) en página Transacciones
 Modal scrollable con cierre en overlay y botón X
 Modelo de Balance v5 (direction-split simétrico): entregado→Egreso, recibido→Ingreso
 Transacciones de cambio con inputs duales, dirección bloqueada en edición
 Confirmación de cambio al modificar USD en edición (modal z-60)
 Tasas automáticas via Cotizave (BCV USD, BCV EUR, Binance P2P) con fallback
 exchange_rates con UNIQUE(date, source) para múltiples tasas por día
 Lazy fetch de tasas solo al seleccionar "Cambio"
 Audit log: triggers INSERT/UPDATE activos, DELETE desde código (trigger dropeado por conflicto FK)
 useTransactions con estado local (sin refresh flash)
 Formato FECHA DD/MM/AAAA, separadores de miles, placeholders sin 0
 Prueba e2e completa (15 escenarios verificados)
Notas: trg_audit_delete dropeado permanentemente. Balance v5 es el definitivo (no revertir a v6).

**Etapa 3 — Integración IA (Gemini OCR)
Estado: ✅ COMPLETADA
Fecha cierre: 2026-07-04
Criterios de aceptación:
 Cliente Gemini con structured output (responseSchema + application/json)
 Validación server-side de archivo (tipo MIME, tamaño max 10MB)
 Compresión cliente (max 1024px, calidad 0.8)
 POST /api/scan recibe FormData, retorna JSON tipado
 ScannerPanel con captura cámara + galería + preview + estados de carga
 ScanResultView con indicador de confianza por colores
 Detección Factura vs Transferencia (botones Ingreso/Gasto)
 Aplicar resultado al formulario con matching de categorías (exacto → keywords → sinónimos)
 Scanner solo en creación (no edición)
 Sin @aws-sdk/client-s3, sin /api/upload, sin vulnerabilidad SSRF
Notas: Imagen es transitoria (no se persiste). receipt_url en DB sin poblar.

**Etapa 3.5 — Correcciones Post-Deploy
Estado: ✅ COMPLETADA
Fecha cierre: 2026-07-04
Commit: d574c66
Criterios de aceptación:
 5 issues de PLAN_CORRECCIONES_POST_DEPLOY.md resueltas
 Deploy en Vercel estable tras correcciones
 Sin regresiones en funcionalidad existente
 
**Etapa 4 — Dashboard Avanzado + Transparencia
Estado: ✅ COMPLETADA
Fecha cierre: 2026-07-07
Gate: requiere aprobación humana antes de Etapa 5
Criterios de aceptación:
 API /api/public/summary leyendo vista public_summary de SQLite
 API /api/public/rates con tasas de cambio recientes
 Página pública /transparencia sin autenticación con datos agrupados
 Dashboard privado con gráficos Recharts — barras mensuales + pie por categoría
 Consultas SQL agregadas (SUM, GROUP BY) en /api/dashboard/stats en vez de traer todas las filas
 Filtros por periodo en dashboard (todo, mes, 3 meses, año, personalizado)
Notas: Recharts 3.9.2 instalado. /transparencia usa /api/public/summary. Dashboard con BarChart (ingresos vs egresos) y PieChart (gastos por categoría).

 
 **Etapa 5 — Modo Offline (PWA)
 Estado: 🔄 EN PROGRESO (finishing 5.6-5.9)
 Fecha cierre: 2026-07-14 (5.1-5.5)
 Dependencias: Etapa 4 completa
 Sub-paso activo: 5.7 — Precache de rutas clave (instalar/ver offline)
 	Sub-pasos (ejecutar UNO a la vez como criterio de aceptación, cada uno es un scope acotado):

5.1 — Service Worker base (Serwist) (✅ COMPLETADO - 2026-07-10)
  Archivo: src/app/sw.ts + sw.ts config
  Scope: registrar SW que intercepte SOLO GET /api/categories y /api/transactions
  Criterio medible: `npm run build` verde; `npx tsc --noEmit` 0 errores; SW presente en build output.
  NO tocar: otras rutas API, proxy.ts, middleware.

5.2 — IndexedDB offline queue
  Archivo: src/lib/offline/db.ts
  Contexto de modelo: el tipo Transaction ya existe en src/types/transaction.ts (interfaz Transaction con campo `is_offline_sync: boolean` en linea 51, mas campos type/amount_usd/amount_bs/currency_primary/category_id/description/transaction_date/etc). Usar ese tipo o su subset.
  Scope: crear store IndexedDB (usando `idb` si esta en deps, o `indexeddb` nativo) en src/lib/offline/db.ts que persista transacciones creadas offline con `is_offline_sync` en false (equivalente a 0). Exportar funciones: `saveOfflineTransaction(tx)`, `getOfflineTransactions()`, `markSynced(id)`.
  Criterio medible: test unitario (Jest, archivo src/lib/offline/db.test.ts) que inserta y lee un registro offline y verifica is_offline_sync=false; `npm run build` verde; `npx tsc --noEmit` 0 errores.
  NO tocar: rutas API, proxy.ts, middleware, ni el SW de 5.1 (src/app/sw.ts).

5.3 — Background sync (✅ COMPLETADO - 2026-07-13)
  Archivo: src/app/sw.ts (EXTIENDE el SW de 5.1, NO reescribir desde cero) + src/lib/offline/db.ts ya existe
  Archivos circundantes a LEER antes de codear (obligatorio):
    - src/app/sw.ts (5.1, ubicado en src/app/sw.ts): registra SW con NetworkFirst para GET /api/categories y /api/transactions, cacheName 'api-cache-v1'. Tiene `self.addEventListener('fetch', ...)`, `self.skipWaiting()` y `clients.claim()` en install/activate. DEBES MODIFICAR este archivo para añadir el sync; NO crear uno nuevo.
    - src/lib/offline/db.ts (5.2): exporta `saveOfflineTransaction(tx)`, `getOfflineTransactions(): Promise<Transaction[]>`, `markSynced(id): Promise<void>`. Store 'offline_transactions' en DB 'finty_offline_db', keyPath 'id'. Campo `is_offline_sync: boolean`; "flag=1" = `is_offline_sync === true`.
    - src/types/transaction.ts: interfaz Transaction (linea 51 tiene is_offline_sync; otros campos: type/amount_usd/amount_bs/currency_primary/category_id/description/transaction_date).
    - src/app/api/transactions/route.ts: POST /api/transactions existe (lo usa el sync para reenviar la cola).
  Scope: implementar sync en segundo plano. Al recuperar conexión (evento `online` del navigator O `self.addEventListener('sync', ...)` con Background Sync API + `registration.sync.register('sync-transactions')`), leer cola con `getOfflineTransactions()`, por cada tx `fetch('/api/transactions', {method:'POST', body: JSON.stringify(tx), headers:{'Content-Type':'application/json'}})` y al éxito `markSynced(tx.id)`. Manejar errores (reintentar en próxima sync).
  Criterio medible (OBLIGATORIO para que el gate pase): crear `src/lib/offline/sync.test.ts` que simula online→offline→online y verifica que tras el sync `markSynced` fue llamado / `is_offline_sync===true` en la cola. El test DEBE fallar si no hay implementación de sync. `npm run build` verde; `npx tsc --noEmit` 0 errores.
  NO tocar: rutas API (usar POST /api/transactions existente), proxy.ts, middleware.

5.4 — Manifest + iconos (instalable)
  Archivos a crear/modificar (OBLIGATORIO para que el gate pase):
    - public/manifest.json (CREAR): JSON con name "Finty", short_name "Finty", description, start_url "/", display "standalone", background_color "#ffffff", theme_color "#2563eb", y "icons" array con al menos {src:"/icons/icon-192.png", sizes:"192x192", type:"image/png"}, {src:"/icons/icon-512.png", sizes:"512x512", type:"image/png"}, y opcional SVG. El manifest DEBE ser válido JSON.
    - public/icons/icon-192.png y public/icons/icon-512.png (CREAR): iconos PNG reales (pueden ser placeholders generados: un cuadrado con fondo theme_color y la letra "F", o usar SVG convertido). También puede crear public/icons/icon.svg como respaldo. CRÍTICO: Lighthouse PWA installable exige al menos un icono PNG 192 y otro 512 con purpose any.
    - src/app/layout.tsx (MODIFICAR): añadir en el <head> el link <link rel="manifest" href="/manifest.json" /> y <meta name="theme-color" content="#2563eb" /> y <link rel="apple-touch-icon" href="/icons/icon-192.png" />. El archivo tiene `export default function RootLayout({` en linea 21; el <head> está cerca. NO reescribir el layout, solo inyectar esos tags.
  Archivos circundantes existentes (contexto, NO tocar):
    - src/proxy.ts: matcher ya excluye 'icons' y 'manifest.json' del proxy (linea 34) → no requiere cambios.
    - @serwist/next ^9.5.11 en package.json (SW ya lo maneja en 5.1).
    - public/sw.js: generado por Serwist en build (no tocar).
  Scope: hacer la PWA instalable. Manifest válido + iconos PNG 192/512 presentes + link en layout.
  Criterio medible (OBLIGATORIO): tras el build, `public/manifest.json` existe y es JSON válido; `public/icons/icon-192.png` y `public/icons/icon-512.png` existen y tienen tamaño > 0 bytes; `src/app/layout.tsx` contiene `rel="manifest"` y `theme-color`. `npm run build` verde; `npx tsc --noEmit` 0 errores.
  NO tocar: src/proxy.ts, public/sw.js, rutas API, middleware.

5.5 — Verificación Cache Storage (✅ COMPLETADO - 2026-07-14)
  Scope: comprobar en Chrome DevTools → Application → Cache Storage que /api/categories y /api/transactions quedan cacheados
  Criterio medible: checklist manual firmado en JOURNAL; build verde.
  Notas: confirmado cache 'api-cache-v1' con GET /api/categories y /api/transactions (NetworkFirst). Etapa 5 base COMPLETADA; sigue finishing 5.6-5.9.

5.6 — NavigationRoute + fallback app shell (✅ COMPLETADO - 2026-07-15)
  Archivos a modificar: `src/app/sw.ts` (EXTIENDE el SW de 5.1, NO reescribir desde cero), `src/app/layout.tsx` (MODIFICAR: inyectar metas iOS).
  Scope: añadir NavigationRoute con NetworkFirst + fallback al app shell cacheado (o /dashboard). Usar precacheEntries + capturar respuestas de navegación. El SW debe servir la navegación offline (no solo /api/*).
  Criterio medible (OBLIGATORIO): tras el build, `src/app/sw.ts` contiene `NavigationRoute` (o handling de request.mode==='navigate') y fallback a /dashboard cacheado; `npm run build` verde; `npx tsc --noEmit` 0 errores; `npm test` 17+ pasando.
  NO tocar: rutas API, proxy.ts, middleware, public/sw.js (generado).

5.7 — Precache de rutas clave
  Estado: ✅ COMPLETADO - 2026-07-15
  Archivos a modificar: `src/app/sw.ts` (EXTIENDE 5.6).
  Scope: incluir rutas clave (/dashboard, /transacciones, /categorias) en el manifest del SW (precacheEntries) para carga sin red.
  Criterio medible: `src/app/sw.ts` incluye las rutas en precacheEntries; build verde; tsc 0 errores.
  Implementación: `precacheEntries: [...(self.__SW_MANIFEST || []), ...PRECACHE_ROUTE_ENTRIES]` con revision estático `finty-routes-v1`. Cuatro rutas precacheadas: /dashboard, /transacciones, /categorias, /transparencia. Confirmado en public/sw.js compilado. Tests 18 OK.

5.8 — Metas iOS/Android en layout
  Archivos a modificar: `src/app/layout.tsx` (MODIFICAR: inyectar metas en <head>).
  Scope: inyectar meta apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, y confirmar apple-touch-icon (ya existe via `src/app/apple-icon.tsx`). Android: theme-color ya presente; asegurar manifest vinculado.
  Criterio medible: `src/app/layout.tsx` contiene `apple-mobile-web-app-capable` y `apple-touch-icon`; build verde; tsc 0 errores.

5.9 — Verificación móvil real
  Scope: en móvil real, el prompt de instalación aparece y abrir offline sirve la app (no consume Vercel).
  Criterio medible: checklist manual firmado en JOURNAL; build verde.

**Estado Etapa 5: 🔄 EN PROGRESO (finishing 5.8-5.9)**
Sub-pasos: 5.1 ✅, 5.2 ✅, 5.3 ✅, 5.4 ✅, 5.5 ✅, 5.6 ✅, 5.7 ✅, 5.8 ⬜, 5.9 ⬜. Base: 18 tests Jest, build rc 0. Rama: feat/5.x_offline-finishing. Siguiente tras 5.9: Etapa 6 Reportes.

 
**Etapa 6 — Automatización de Reportes
Estado: ⬜ NO INICIADA
Dependencias: Etapa 4 parcial
Criterios de aceptación:
 API /api/reports con JOIN categorías + filtros por periodo
 Generación PDF client-side (jsPDF + autoTable)
 Generación CSV client-side (PapaParse)
 GitHub Action semanal enviando resumen por email (Resend)
 Auth vía x-api-key para GitHub Actions.
 
**Etapa 7 — Auditoría UI + Performance
Estado: ⬜ NO INICIADA
Dependencias: Etapa 2 completa
Criterios de aceptación:
 Página /audit con tabla de audit_log (JOIN users)
 Diff visual en updates (JSON.parse de old_values/new_values desde SQLite TEXT)
 GitHub Action para tasa diaria (si aplica, ya hay Cotizave)
 Query agregada en Dashboard (eliminar over-fetching de 50 transacciones)
 Evaluar Server Components para datos iniciales (eliminar waterfall)
 Evaluar eliminar auth query por request (JWT o validación sin DB)
 
 
**BACKLOG (no priorizado)
Gateway de Visión OCR (v2.1)
Estado: ⬜ PLANIFICADO
Motivo: Gemini free tier tiene 15 RPM / 1M TPM. Al escalar se agota.
Propuesta: Abstraer /api/scan con router multicuota (Omniroute o custom en Render free tier)
Proveedores candidatos: Gemini (múltiples keys), Claude Haiku, Groq (Llama Vision), Mistral
Estrategia: Fallback encadenado → si uno falla por 429, intenta el siguiente
Costo estimado: $0/mes (todo free tier)
Detalle completo: ANALISIS_ETAPA_3_version2.md
Nota: No bloquea ninguna etapa. Se implementa cuando el límite de Gemini sea un problema real.
