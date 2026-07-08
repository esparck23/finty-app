**BLOCKERS — Finty**

**BLK-001 — Vitest no resuelve tipos de Vite en Windows**
Fecha: 2026-07-07
Bloquea: Etapa 0 — Harness de Tests
Síntoma: `vitest.config.ts` y tipos de `node_modules/vitest` reportan `TS2307 Cannot find module 'vite' / '@vitest/utils/display'`, aunque existen en disco.
Causa probable: resolución de módulos TypeScript/Windows en este proyecto (`moduleResolution` no es `bundler/nodenext`), o dependencia transitiva de Vite faltante/rota tras instalación corrupta.
Intento aplicado: reinstalación limpia de `node_modules`, `package-lock.json`, cache npm, y creación de `vitest.config.ts`.
Regla de reintento: máx 3 intentos por problema antes de dejar bloqueado.
Siguiente acción sugerida: cambiar `moduleResolution` a `bundler` en `tsconfig.json` o, si persiste, cambiar estrategia a Jest.
