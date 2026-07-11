**JOURNAL — Finty** (no se elimina la información se sigue redactando)

# 2026-07-08 — Cierre de Etapa 4 (feedback 6 y 7)

## Resumen del día
Sesión de cierre de Etapa 4 con 2 rondas de feedback del usuario sobre preview de Vercel.

## Eventos
- **Feedback 6 (DEC-016):** cards de /transparencia no coincidían con Transacciones. Causa raíz: /transparencia ignoraba transacciones `exchange` (no aplicaba split v5). Qoder corrigió (commit 6a3798a). Build verde. PR #5 abierto.
- **Feedback 7 (DEC-017):** (1) tabla /transparencia solo mostraba 10 items vs #27 en card; (2) número Bs desbordaba card en móvil.
  - Qoder intento 1: timeout 600s, dejó parcial (/api/public/transactions + TxRow).
  - Qoder intento 2: FALLÓ por rate limit API (FORBIDDEN code 115, reset 2026-07-18). BLK-003 registrado.
  - Qwen activado (v0.19.7): completó DEC-017 (commit 3be5bb0) — tabla paginada al 100% vía /api/public/transactions + cards Bs móvil. BLK-003 resuelto.
  - Corrección leve directa de Hermes (commit 600c4f5): `shrink-0` en label, `min-w-0 flex-1 break-words` en valores, font-size responsivo. Build verde.
- **Merge:** PR #5 (DEC-016 + DEC-017 + fix) → main (commit 62dcf1c). Etapa 4 COMPLETADA.

## Métricas
- PRs mergeados hoy: #5 (acumulado Etapa 4: #3, #4, #5).
- Agentes: Qoder (DEC-012→016, falló 017), Qwen (DEC-017).
- Bloqueos: BLK-003 abierto y resuelto (Qwen). BLK-001 sigue pendiente (Etapa 0 Vitest→Jest).

## Siguiente
- Etapa 5: PWA offline (Serwist + IndexedDB), tras gate humano.

# 2026-07-08 (parte 2) — Arranque Etapa 0 (Harness de Tests, DEC-018)

## Resumen
Tras cerrar Etapa 4, el usuario aprobó arrancar Etapa 0 migrando de Vitest a Jest.

## Eventos
- **DEC-018 registrado:** arranque de Etapa 0 con Jest. Limpieza de Vitest + andamiaje Jest.
- **BLK-001 resuelto:** la decisión DEC-010/DEC-018 descarta Vitest (tipos Vite rotos en Windows) y migra a Jest.
- **Qwen delegado para DEC-018:** fallo 1 por error de ruta en comando de Hermes (exit 128, no de Qwen); relanzado.
- **Qwen fallo 2:** `API Error: 400 property 'enable_thinking' is unsupported` (exit 1). Qwen dejó parcial (borró vitest.config.ts, quitó vitest de package.json, creó jest.config.ts) pero no commiteó ni verificó. BLK-004 registrado.
- **Hermes terminó DEC-018 directo:** corrigió jest.config.ts a config limpia con @swc/jest (sin next-jest, que no existe como paquete en Next 16), creó src/lib/utils/currency.test.ts (4 tests).
- **Verificación Hermes:** `npm test` 4/4 pasan; `npm run build` verde. BLK-004 cerrado.
- **PR #6 mergeado:** feat Etapa 0 Jest (DEC-018) → main (commit de merge 2026-07-08T21:46Z). Etapa 0 COMPLETADA.

## Métricas
- PRs hoy: #5 (Etapa 4, mergeado), #6 (Etapa 0 Jest, mergeado).
- Agentes: Qoder (Etapa 4), Qwen (DEC-017 OK; DEC-018 falló por API → Hermes terminó).
- Bloqueos: BLK-001 resuelto (Jest), BLK-004 abierto y resuelto (Qwen API error; Hermes completó).

## Siguiente
- Merge de PR #6 tras gate humano.
- Ampliar suite de tests (criterio de aceptación Etapa 0: ≥1 test en CI/CD más adelante según usuario).
- Etapa 5: PWA offline, tras gate.

# 2026-07-10 — RUN motor A2A Factory (BLK-005, fallo de infraestructura)

## Resumen
Primer run real del motor A2A Factory sobre finty-app (activo en active.yaml). Pipeline Qwen → Vibe → Compiler → Pi (x3) detenido por "Quality Gate fallido tras 3 intentos".

## Eventos
- workflow.py leyó scope desde `Próxima acción: Modo Offline (PWA).` (regex dual aplicada OK, ya no cae a fallback).
- Qwen y Vibe invocados; NO alteraron archivos de código de Finty (diff de jest.config.ts / currency.test.ts vacío).
- Compiler (quality gate) falló los 3 intentos con `[WinError 2] El sistema no puede encontrar el archivo especificado`.
- Causa raíz verificada por Hermes: `nodes.py` lanza `npm test` / `npx tsc --noEmit` vía `subprocess.run` desde `py -3.13`. En Windows `npm`/`npx` son `npm.cmd`/`npx.cmd` y `subprocess` no resuelve la extensión `.cmd` → WinError 2. El gate NUNCA ejecutó las pruebas reales de Finty → **falso negativo**, no es fallo del proyecto.
- Motor escribió un BLOCKER crudo; Hermes lo reemplazó por BLK-005 con diagnóstico de causa raíz y regla de no-reintento.
- `.harness/` modificado por el run (STATE/JOURNAL/BLOCKERS/STAGES) sin commitear (working tree sucio en agentpc-dev).

## Métricas
- Agentes: motor A2A Factory (Qwen/Vibe/Pi). Qoder no ejecutado (modo ahorro).
- Bloqueos: BLK-005 abierto (infraestructura del motor, Windows npm.cmd). Espera gate humano.
- Impacto en código de Finty: 0 archivos modificados.

## Siguiente
- Fix en `nodes.py` `run_quality_gate` para Windows: usar `npm.cmd`/`npx.cmd` explícitos o `shell=True`, o inyectar el dir de `npm.cmd` en `env["PATH"]`.
- Re-test pre-relanzamiento: `py -3.13 -c "import subprocess; subprocess.run(['npm.cmd','--version'])"` debe retornar 0.
- NO relanzar el motor hasta el fix (reintentar da el mismo WinError 2).
- Etapa 5 PWA sigue tras gate.

# 2026-07-10 (parte 2) — Etapa 5: PWA Offline — Service Worker base (Serwist)

## Resumen
Implementación exitosa del Service Worker base (Serwist) según el Objetivo 5.1. Se instalaron las dependencias, se configuró Next.js y se registró el Service Worker que intercepta exclusivamente GET `/api/categories` y `/api/transactions`.

## Eventos
- **Dependencias instaladas:** Se agregaron `@serwist/next` y `serwist` a `dependencies`. Además se agregó `react-is` para solucionar el problema de compilación de Recharts bajo Webpack.
- **Configuración de Next.js:** Se adaptó `next.config.ts` para integrar `@serwist/next` mediante `withSerwistInit` y se actualizó el script `build` en `package.json` para usar `next build --webpack`.
- **Implementación de Service Worker (`src/app/sw.ts`):** Se configuró Serwist con `precacheEntries` y una regla de caché runtime usando la estrategia `NetworkFirst` que intercepta **únicamente** peticiones GET a `/api/categories` y `/api/transactions`.
- **Registro del SW (`src/app/sw-register.tsx`):** Se creó un componente cliente que registra el Service Worker de manera segura en el cliente, y se integró en el `RootLayout` global (`src/app/layout.tsx`).
- **Verificación exitosa:** Se comprobó que `npx tsc --noEmit` compila con 0 errores y que `npm run build` es 100% verde con el Service Worker empaquetado en `public/sw.js`.

## Métricas
- Estado de Etapa 5: Actualizado a EN PROGRESO (5.1 completado, 5.2 pendiente).
- Bloqueos: Ninguno nuevo.
- Impacto en código: Altamente localizado y con impacto mínimo controlado.

## Siguiente
- Etapa 5.2 — IndexedDB offline queue (src/lib/offline/db.ts).

# 2026-07-10 (parte 3) — Prueba de 5.1 con Jest por Pi (acción EXTERNA al motor)

## Resumen
A pedido del usuario, se validó el bloque 5.1 (Service Worker base Serwist) invocando Pi de forma externa al motor A2A Factory (no vía workflow.py), con el mandato de añadir cobertura Jest.

## Eventos
- Pi (pi.cmd --mode json) invocado directamente sobre finty-app con prompt acotado a 5.1 (verificar sw.ts/sw-register.tsx + añadir test Jest, sin tocar otras rutas/proxy/middleware). Exit 0.
- Pi creó `src/app/sw.test.ts`: tests estáticos sobre el fuente de sw.ts (el SW real corre en contexto Service Worker, no en jsdom, por lo que valida el contrato del código).
- Cobertura del test: intercepta SOLO /api/categories y /api/transactions; solo GET; NO intercepta otras rutas /api/* (lista de forbidden paths); estrategia NetworkFirst; cacheName api-cache-v1; sw-register.tsx es Client Component y registra /sw.js de forma segura.
- Pi NO creó pyproject.toml ni tests/ esta vez (a diferencia del run del motor).

## Verificación (por Hermes, en disco)
- `npm test` (Jest): rc 0 → **14 tests passed** (2 suites: sw.test.ts + currency.test.ts).
- `npm run build`: rc 0 (verde, SW empaquetado en public/sw.js).

## Métricas
- Agentes: Pi (externo al motor). Motor A2A Factory NO usado en esta acción.
- Bloqueos: ninguno nuevo. BLK-006 (falso positivo de "detenido") sigue abierto para la otra sesión.
- Impacto en código: +1 archivo (src/app/sw.test.ts), localizado.

## Siguiente
- 5.1 COMPLETADO y con cobertura Jest. Listo para gate humano (commit en agentpc-dev).
- Etapa 5.2 — IndexedDB offline queue (src/lib/offline/db.ts).


