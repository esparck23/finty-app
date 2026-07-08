**STAGES — Finty**

**Etapa 0 — Harness de Tests
Estado: 🟡 EN CURSO (arrancada 2026-07-08, DEC-018)
Gate: requiere aprobación humana para arrancar
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

**Etapa 5 — Modo Offline (PWA
Estado: ⬜ NO INICIADA
Dependencias: Etapa 4 completa
Criterios de aceptación:
 Service Worker (Serwist) interceptando /api/categories y /api/transactions
 IndexedDB para transacciones creadas offline
 Background sync al recuperar conexión con is_offline_sync = 1
 App instalable (manifest.json + iconos)
 Verificación en Chrome DevTools → Application → Cache Storage.
 
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
