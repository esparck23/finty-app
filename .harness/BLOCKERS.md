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
{"type":"message_end","message":{"role":"user","content":[{"type":"text","text":"Fix 

**BLK-006 — Motor corta por "3 intentos" aunque la última pasada sea verde (falso positivo de "detenido")**
Fecha: 2026-07-10
Bloquea: interpretación de resultado del motor A2A Factory (reporte al usuario).
Síntoma: en el run de Etapa 5.1, el log finalizó "HERMES CRITICAL finty-app detenido tras 3 intentos" y el JOURNAL/STATE registraron éxito (5.1 COMPLETADO, build verde verificado por Hermes con `npm.cmd run build` rc 0). Las 2 primeras pasadas del quality gate fallaron mientras Qwen/Vibe escribían el código; Pi reparó y la 3.a pasada quedó verde, pero el motor contó los intentos previos y cortó igual.
Causa: `workflow.py` cuenta intentos de quality gate de forma acumulativa y detiene el pipeline al llegar a 3, sin revisar si el estado final en disco es verde. No distingue "falló y se reparó" de "falló y no se reparó".
Impacto: confunde al operador (reporte de fallo vs éxito real en disco). El código de 5.1 quedó correcto.
Siguiente acción sugerida (para la otra sesión): en `workflow.py`, tras el último intento de Pi, re-ejecutar el quality gate UNA vez más y usar ESE resultado como veredicto final; o bien, no incrementar retry_count si la pasada anterior fue verde. No relanzar el motor solo por este reporte (el código ya está bien).
Regla: fallo de LÓGICA del motor (agente-side), no del proyecto. Registrado, espera gate humano.

