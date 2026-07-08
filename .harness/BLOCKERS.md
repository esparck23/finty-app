**BLOCKERS — Finty**

**BLK-001 — Vitest no resuelve tipos de Vite en Windows**
Fecha: 2026-07-07
Bloquea: Etapa 0 — Harness de Tests
Síntoma: `vitest.config.ts` y tipos de `node_modules/vitest` reportan `TS2307 Cannot find module 'vite' / '@vitest/utils/display'`, aunque existen en disco.
Causa probable: resolución de módulos TypeScript/Windows en este proyecto (`moduleResolution` no es `bundler/nodenext`), o dependencia transitiva de Vite faltante/rota tras instalación corrupta.
Intento aplicado: reinstalación limpia de `node_modules`, `package-lock.json`, cache npm, y creación de `vitest.config.ts`.
Regla de reintento: máx 3 intentos por problema antes de dejar bloqueado.
Siguiente acción sugerida: cambiar `moduleResolution` a `bundler` en `tsconfig.json` o, si persiste, cambiar estrategia a Jest.

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

**BLK-003 (actualización 2026-07-08, RESUELTO por Qwen)**
Qwen Code CLI (v0.19.7) completó DEC-017 exitosamente (session proc_cec89d94d9dd, exit 0). Commit 3be5bb0 en agentpc-dev: paginación de tabla /transparencia conectada a /api/public/transactions (recorre las 27 transacciones, no solo 10) + cards Bs en móvil sin desborde. Build verde verificado por Hermes. BLK-003 cerrado. Nota: Qoder siguió en rate limit (reset 2026-07-18) pero la vía alterna (Qwen) resolvió el bloqueo sin esperar.




