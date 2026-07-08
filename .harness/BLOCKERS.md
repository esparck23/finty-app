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
