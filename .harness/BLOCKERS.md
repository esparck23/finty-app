**BLOCKERS — Finty**

**BLK-001 — Vitest no resuelve tipos de Vite en Windows (RESUELTO por migración a Jest)
Fecha: 2026-07-07 | Resuelto: 2026-07-08 (DEC-018)
Bloquea: Etapa 0 — Harness de Tests
Síntoma original: `vitest.config.ts` y tipos de `node_modules/vitest` reportan `TS2307 Cannot find module 'vite' / '@vitest/utils/display'`, aunque existen en disco.
Causa probable: resolución de módulos TypeScript/Windows (`moduleResolution` no es `bundler/nodenext`), o dependencia transitiva de Vite faltante/rota.
Intento aplicado: reinstalación limpia de `node_modules`, `package-lock.json`, cache npm, y creación de `vitest.config.ts`. Persistió.
Resolución: DEC-010 + DEC-018 descartan Vitest en este proyecto Windows y migran la Etapa 0 a **Jest** (sin depender del pipeline Vite/rolldown). Qwen ejecuta la limpieza de Vitest y el andamiaje de Jest (DEC-018).

**BLK-002 — No se pudo appendar DEC-016 en DECISIONS.md vía patch (texto duplicado)
Fecha: 2026-07-07
Bloquea: registro de DEC-016 (feedback 6, punto de verdad /transparencia).
Síntoma: el bloque final de DEC-015 es idéntico al ancla propuesto para DEC-016 (frase de regla de ejecución + líneas de DEC-015 p2/p3), así que patch falló por múltiples matches.
Causa: las decisiones DEC-013/014/015 comparten texto de cierre repetido; el editor por fuzzy match no distingue.
Intento aplicado: 3 intentos de patch con distintos anclas; todos fallaron por matches no únicos.
Regla de reintento: máx 3 intentos → bloqueado.
Siguiente acción sugerida: reescribir DECISIONS.md completo con write_file (sin fuzzy) agregando DEC-016 al final, o usar append por terminal. El contenido de DEC-016 ya está definido y validado por el usuario: las cards de /transparencia deben coincidir con los cálculos de Transacciones (mismo punto de verdad); Balance = Total Ingreso - Total Egreso (v5).

**BLK-003 — Qoder no cerró DEC-017 (timeout 600s)
Fecha: 2026-07-08
Bloquea: DEC-017 (paginación tabla /transparencia al 100% + cards Bs móvil).
Síntoma: `qodercli -q` corrió 600s sin retornar; no hubo commit. No hay proceso colgado al finalizar.
Causa probable: DEC-017 p1 implica paginar la tabla completa (no solo el resumen SummaryRow), lo que requiere lista cruda de transacciones. Qoder empezó a crear `/api/public/transactions` y a tipar `TxRow` en page.tsx pero no terminó (timeout).
Intento aplicado: 1 ejecución de Qoder (timeout). Regla de reintento: máx 3 intentos por problema antes de dejar bloqueado → este es el 1er intento fallido; aún quedan 2 reintentos disponibles.
Estado parcial dejado por Qoder (SIN commitear, en agentpc-dev):
- `src/app/transparencia/page.tsx`: solo añadió la interfaz `TxRow` (incompleto).
- `src/app/api/public/transactions/route.ts`: NUEVO, lista cruda de transacciones con filtro from/to (parece funcional pero sin probar).
Siguiente acción sugerida (reintento 2): relanzar Qoder con prompt MÁS ACOTADO — decirle que retome el trabajo parcial (usar /api/public/transactions ya creado), enforcar solo: (a) conectar la tabla de /transparencia a la lista paginada de TODAS las transacciones (no al summary de 10), probar que recorre #27; (b) cards Bs móvil no desbordan. Subir timeout a 900s. No perder el route.ts ya creado.

**BLK-003 (actualización 2026-07-08, intento 2 FALLIDO por rate limit de Qoder API)**
Nuevo síntoma: reintento 2 lanzado en background (session proc_97d917fa7461) → exit code 1. Error de Qoder API: `FORBIDDEN {"code":"115","message":{"agentLimitResetTime":1784407203792}}`.
Causa: límite de uso de la cuenta/agente de Qoder (no es fallo de código ni de proyecto). Reset del límite: epoch 1784407203792 = **2026-07-18 16:40 (hora local)**.
Reintentos restantes: 1 de 3 (2 fallidos: timeout + rate limit). NO reintentar hasta que se libere el límite (2026-07-18 16:40); reintentar antes dará el mismo FORBIDDEN.
Estado del trabajo parcial (sin commitear, conservado en agentpc-dev): src/app/transparencia/page.tsx (TxRow tipado, incompleto) + src/app/api/public/transactions/route.ts (nuevo, sin probar). No se pierde.
Siguiente acción sugerida (reintento 3, post-reset): tras 2026-07-18 16:40, relanzar Qoder con el mismo prompt acotado de reintento 2. Mientras tanto, opción alterna: Hermes podría implementar DEC-017 directamente (sin Qoder) si el usuario lo prefiere para no esperar al reset.

**BLK-004 — Qwen API error al arrancar DEC-018 (enable_thinking)
Fecha: 2026-07-08
Bloquea: delegación a Qwen para DEC-018 (Etapa 0 Jest).
Síntoma: `qwen --yolo` exit 1 con `API Error: 400 [400]: property 'enable_thinking' is unsupported`. Qwen avanzó parcialmente antes de fallar (eliminó vitest.config.ts, quitó vitest de package.json, creó jest.config.ts), pero no commiteó ni verificó.
Causa: la cuenta/modelo de Qwen usada no soporta el parámetro `enable_thinking` que inyecta la CLI. Error de API del proveedor, no del proyecto.
Resolución: Hermes terminó DEC-018 directamente (sin Qwen). Se corrigió jest.config.ts a config limpia con @swc/jest (sin next-jest, que no existe como paquete en Next 16), se creó src/lib/utils/currency.test.ts (4 tests), npm test pasa (4/4) y npm run build verde. BLK-004 cerrado; DEC-018 completada por Hermes.






### 2026-07-10 18:56 — RUN motor A2A Factory DETENIDO (BLK-005, NO es fallo de Finty)
- Síntoma: workflow.py terminó con "Quality Gate fallido tras 3 intentos" → pipeline detenido, sin escribir STATE.
- Error crudo: `[WinError 2] El sistema no puede encontrar el archivo especificado` en los 3 intentos de quality gate.
- CAUSA RAÍZ (verificada por Hermes): `nodes.py` invoca el quality gate con `subprocess.run(["npm","test"])` / `["npx","tsc","--noEmit"]` desde `py -3.13`. En Windows, `npm`/`npx` son `npm.cmd`/`npx.cmd`, no exe; `subprocess` no resuelve la extensión `.cmd` y lanza WinError 2. El gate NUNCA ejecutó las pruebas reales de Finty → falso negativo.
- Impacto en código de Finty: NINGUNO. `git diff jest.config.ts src/lib/utils/currency.test.ts` está vacío; Qwen/Vibe no modificaron archivos de código (o sus salidas no tocaron esos paths). El único cambio en disco es el .harness (STATE/JOURNAL/BLOCKERS/STAGES) que el motor escribió/mergeó.
- Los cambios en `.harness/` del run NO están commiteados (working tree sucio en agentpc-dev).
- Siguiente acción sugerida (ABRIR GATE HUMANO): corregir `nodes.py` `run_quality_gate` para Windows — usar `npm.cmd`/`npx.cmd` explícitos o `shell=True`, o invocar vía `py -3.13` con `env["PATH"]` que incluya el directorio de `npm.cmd`. Re-testear con `py -3.13 -c "import subprocess; subprocess.run(['npm.cmd','--version'])"` antes de relanzar el motor. NO relanzar el motor hasta ese fix (reintentar da el mismo WinError 2).
- Regla: esto es fallo de INFRAESTRUCTURA del motor (agente-side), no del proyecto. Registrado y en espera de decisión del usuario (procedimiento agent-fallback). No reintentar a ciegas.


**BLK-005 — quality gate falla en Windows porque npm/npx no se resuelven sin .cmd**
Fecha: 2026-07-09
Bloquea: Ejecución del motor A2A Factory sobre finty-app en Windows.
Síntoma: subprocess.run(["npm", ...]) desde py -3.13 retorna WinError 2 aunque npm esté instalado.
Causa: En Windows, npm/npx son cmd/bat; sin PATHEXT/shell=True, subprocess con lista no resuelve la extensión.
Resolución pendiente: Adaptar run_quality_gate a Opción C (shutil.which + EXTRA_PATHS) para resolver npm/npx real antes de ejecutar.

### 2026-07-10 20:01:05 — Quality Gate fallido tras 3 intentos
- Error: > finty-app@0.1.0 test
> jest
> finty-app@0.1.0 build
> next build --webpack

▲ Next.js 16.2.10 (webpack)
- Environments: .env.local
- Experiments (use with caution):
  · serverActions

  Creating an optimized production build ...
✓ (serwist) Bundling the service worker script with the URL '/sw.js' and the scope '/'...
✓ Compiled successfully in 10.2s
  Running TypeScript ...
  Finished TypeScript in 14.6s ...
  Collecting page data using 1 worker ...
  Generating static pages using 1 worker (0/16) ...
  Generating static pages using 1 worker (4/16) 
  Generating static pages using 1 worker (8/16) 
  Generating static pages using 1 worker (12/16) 
✓ Generating static pages using 1 worker (16/16) in 1910ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/categories
├ ƒ /api/categories/[id]
├ ƒ /api/dashboard/stats
├ ƒ /api/exchange-rates
├ ƒ /api/exchange-rates/bcv
├ ƒ /api/public/rates
├ ƒ /api/public/summary
├ ƒ /api/public/transactions
├ ƒ /api/scan
├ ƒ /api/transactions
├ ƒ /api/transactions/[id]
├ ○ /categories
├ ○ /dashboard
├ ○ /login
├ ○ /transactions
└ ƒ /transparencia


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
- Logs: {"type":"session","version":3,"id":"019f4e74-a259-74c2-9e26-696a78fe9e66","timestamp":"2026-07-10T23:54:54.425Z","cwd":"C:\\Users\\Agent\\dev\\finty-app"}
{"type":"agent_start"}
{"type":"turn_start"}
{"type":"message_start","message":{"role":"user","content":[{"type":"text","text":"Fix the project in C:\\Users\\Agent\\dev\\finty-app so black --check and pytest pass. Error context:"}],"timestamp":1783727694512}}
{"type":"message_end","message":{"role":"user","content":[{"type":"text","text":"Fix"}]

**BLK-006 — Quality gate marca FAILED si hay stdout, aunque los comandos pasen (rc 0)**
Fecha: 2026-07-10 (abierto) / 2026-07-11 (causa raíz real + resuelto)
Bloquea: interpretación de resultado del motor A2A Factory.
Síntoma: en runs 5.1 y 5.2 el log decía "quality gate final fallido / detenido", pero en disco `npm test` y `npm run build` pasaban (rc 0). El motor cortaba injustamente.
CAUSA RAÍZ REAL: `nodes.py` `run_quality_gate` acumulaba `proc.stdout.strip()` de cada comando exitoso en `logs`, y luego `diagnostics = "\n".join(logs); if diagnostics: quality_gate_passed=False`. Como `npm test`/`build` exitosos emiten salida (ej. "Tests: 17 passed"), `diagnostics` nunca estaba vacío → el gate decía FAILED aunque TODO pasó (rc 0).
RESOLUCIÓN: el veredicto ahora se basa en `returncode` (acumulador `failed`); la salida stdout de comandos exitosos se registra como info ("OK"), no como fallo. Verificado: sobre el estado actual de finty (5.2 verde en disco) el gate retorna `quality_gate_passed=True`, `retry_count` intacto.
Estado: RESUELTO en motor (nodes.py). Nota: el intento previo de "repair_loops + pasada final" en workflow.py NO arreglaba esto; el bug estaba en nodes.py.
Regla: fallo de LÓGICA del motor, corregido por Hermes.


### 2026-07-11 13:24:39 — Quality Gate fallido en pasada final
- Error: > finty-app@0.1.0 test
> jest
> finty-app@0.1.0 build
> next build --webpack

▲ Next.js 16.2.10 (webpack)
- Environments: .env.local
- Experiments (use with caution):
  · serverActions

  Creating an optimized production build ...
✓ (serwist) Bundling the service worker script with the URL '/sw.js' and the scope '/'...
✓ Compiled successfully in 9.1s
  Running TypeScript ...
  Finished TypeScript in 15.0s ...
  Collecting page data using 1 worker ...
  Generating static pages using 1 worker (0/16) ...
  Generating static pages using 1 worker (4/16) 
  Generating static pages using 1 worker (8/16) 
  Generating static pages using 1 worker (12/16) 
✓ Generating static pages using 1 worker (16/16) in 1943ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/categories
├ ƒ /api/categories/[id]
├ ƒ /api/dashboard/stats
├ ƒ /api/exchange-rates
├ ƒ /api/exchange-rates/bcv
├ ƒ /api/public/rates
├ ƒ /api/public/summary
├ ƒ /api/public/transactions
├ ƒ /api/scan
├ ƒ /api/transactions
├ ƒ /api/transactions/[id]
├ ○ /categories
├ ○ /dashboard
├ ○ /login
├ ○ /transactions
└ ƒ /transparencia


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
- Logs: > finty-app@0.1.0 test
> jest
> finty-app@0.1.0 build
> next build --webpack

▲ Next.js 16.2.10 (webpack)
- Environments: .env.local
- Experiments (use with caution):
  · serverActions

  Creating an optimized production build ...
✓ (serwist) Bundling the service worker script with the URL '/sw.js' and the scope '/'...
✓ Compiled successfully in 9.1s
  Running TypeScript ...
  Finished TypeScript in 15.0s ...
  Collecting page data using 1 worker ...
  Generating static pages using 1 worker (0/1

**BLK-007 — Etapa 5.2 no entregada: _load_prompt descartaba el bloque del sub-paso**
Fecha: 2026-07-11
Bloquea: avance de Etapa 5.2 (IndexedDB offline queue) vía motor.
Síntoma original: run del motor abortó por quality gate fallido; `src/lib/offline/db.ts` NO existía tras el run.
CAUSA RAÍZ REAL (corregida): `workflow.py` `_load_prompt` extraía SOLO la primera línea del sub-paso activo (`sm.group(1).strip().splitlines()[0][:300]`). Para 5.2 eso daba "5.2 — IndexedDB offline queue" sin contexto de modelo ni funciones a exportar → Qwen no sabía qué hacer y no entregaba `db.ts`. No era fallo de Qwen, era que el motor le pasaba un prompt vacío de instrucciones.
RESOLUCIÓN: `_load_prompt` ahora busca el bloque completo del sub-paso (ej. "5.2 — ..." + líneas indentadas) en la sección de sub-pasos de STAGES.md y lo pasa como Alcance. Verificado: prompt de 5.2 ahora tiene 1111 chars con contexto de modelo, funciones y criterio.
Estado: RESUELTO en motor (workflow.py). Re-run de 5.2 pendiente de validación.
Regla: fallo agente-side (motor), corregido por Hermes.


### 2026-07-11 13:58:32 — Quality Gate fallido en pasada final
- Error: > finty-app@0.1.0 test
> jest
> finty-app@0.1.0 build
> next build --webpack

▲ Next.js 16.2.10 (webpack)
- Environments: .env.local
- Experiments (use with caution):
  · serverActions

  Creating an optimized production build ...
✓ (serwist) Bundling the service worker script with the URL '/sw.js' and the scope '/'...
✓ Compiled successfully in 9.2s
  Running TypeScript ...
  Finished TypeScript in 15.0s ...
  Collecting page data using 1 worker ...
  Generating static pages using 1 worker (0/16) ...
  Generating static pages using 1 worker (4/16) 
  Generating static pages using 1 worker (8/16) 
  Generating static pages using 1 worker (12/16) 
✓ Generating static pages using 1 worker (16/16) in 1944ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/categories
├ ƒ /api/categories/[id]
├ ƒ /api/dashboard/stats
├ ƒ /api/exchange-rates
├ ƒ /api/exchange-rates/bcv
├ ƒ /api/public/rates
├ ƒ /api/public/summary
├ ƒ /api/public/transactions
├ ƒ /api/scan
├ ƒ /api/transactions
├ ƒ /api/transactions/[id]
├ ○ /categories
├ ○ /dashboard
├ ○ /login
├ ○ /transactions
└ ƒ /transparencia


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
- Logs: > finty-app@0.1.0 test
> jest
> finty-app@0.1.0 build
> next build --webpack

▲ Next.js 16.2.10 (webpack)
- Environments: .env.local
- Experiments (use with caution):
  · serverActions

  Creating an optimized production build ...
✓ (serwist) Bundling the service worker script with the URL '/sw.js' and the scope '/'...
✓ Compiled successfully in 9.2s
  Running TypeScript ...
  Finished TypeScript in 15.0s ...
  Collecting page data using 1 worker ...
  Generating static pages using 1 worker (0/1


**BLK-008 — Motor da por COMPLETADO un sub-paso si el quality gate pasa, sin verificar que el código objetivo se escribió** [RESUELTO 2026-07-13]
Fecha: 2026-07-13
Bloquea: avance fiable de Etapas via motor A2A Factory.
Síntoma: run de 5.3 → motor "Quality Gates aprobados" + "PIPELINE COMPLETADO". Pero en disco: src/app/sw.ts NO fue extendido, no hay sync.ts/sync.test.ts, working tree sin código nuevo. El build/test pasaba (rc 0, 17 tests) por los de 5.2. El motor terminó "aprobado" sobre el estado previo sin que Qwen produjera 5.3.
Causa raíz: workflow.py considera el sub-paso completado si run_quality_gate retorna True. No valida que el OBJETIVO se cumplió (archivo/criterio de STAGES exista o cambió). Si Qwen no toca nada, el gate pasa igual y el motor asume éxito. Falso positivo de "completado" (complementario a BLK-006, falso negativo).
Impacto: 5.3 no implementado; 0 archivos nuevos de sync.
GATE HUMANO: NO reintentar a ciegas. (a) Re-run forzando cambio; (b) Pi externo directo (como 5.1/5.2); (c) otra.
Regla: fallo LÓGICA del motor, corregido por Hermes. Espera decisión usuario.

### 2026-07-13 15:00:04 — Crash del orquestador
- Excepción: UnboundLocalError: cannot access local variable 'modify_candidates' where it is not associated with a value


### 2026-07-13 16:33:49 — BLK-008: objetivo STAGES no cumplido
- BLK-008 objective not met: Missing file: public/icons/icon-192.png; Missing file: public/icons/icon-512.png; Missing file: public/icons/icon.svg; Missing file: public/manifest.json; No changes detected vs origin/main: src/app/layout.tsx
