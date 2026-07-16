🟢 Salud: Verde
Hecho: 5.6 — NavigationRoute + fallback app shell (implementado sw.ts y layout.tsx).
🔜 Sigue: 5.7 — Precache de rutas clave (incluir /dashboard, /transacciones, /categorias en precacheEntries de sw.ts).
Acción / Scope: Extender src/app/sw.ts (sobre 5.6) para precachear rutas clave (/dashboard, /transacciones, /categorias) en precacheEntries, logrando carga sin red del app shell. NO reescribir desde cero.
Criterio medible: tras el build, src/app/sw.ts incluye las rutas en precacheEntries; npm run build verde; npx tsc --noEmit 0 errores; npm test 17+ pasando.
⚠️ Riesgo: no romper el NavigationRoute de 5.6 al añadir precache.
No tocar: rutas API, proxy.ts, middleware, public/sw.js (generado).
¿Acción tuya?: NO
