**JOURNAL — Finty**

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
- **PR #6 abierto:** feat Etapa 0 Jest (DEC-018), pendiente de merge/gate humano.

## Métricas
- PRs hoy: #5 (Etapa 4, mergeado), #6 (Etapa 0 Jest, abierto).
- Agentes: Qoder (Etapa 4), Qwen (DEC-017 OK; DEC-018 falló por API → Hermes terminó).
- Bloqueos: BLK-001 resuelto (Jest), BLK-004 abierto y resuelto (Qwen API error; Hermes completó).

## Siguiente
- Merge de PR #6 tras gate humano.
- Ampliar suite de tests (criterio de aceptación Etapa 0: ≥1 test en CI/CD).
- Etapa 5: PWA offline, tras gate.

