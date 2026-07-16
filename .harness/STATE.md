🟢 Salud: Verde
Hecho: 5.8 — Metas iOS/Android en layout (meta apple-mobile-web-app-capable inyectada; status-bar + apple-touch-icon emitidos por Next; manifest vinculado).
🔜 Sigue: 5.9 — Verificación móvil real (pendiente de prueba manual tuya en dispositivo físico).
Acción / Scope: checklist manual en móvil real (iOS Safari Add-to-Home + Android Chrome). Confirmar que el prompt de instalación aparece y que abrir offline sirve la app (app shell cacheado por 5.6/5.7).
Criterio medible: checklist manual firmado en JOURNAL; build verde de toda Etapa 5.
⚠️ Riesgo: depende de dispositivo físico; no automatizable headless.
No tocar: rutas API, proxy.ts, middleware, public/sw.js (generado), src/app/sw.ts, src/app/layout.tsx.
¿Acción tuya?: SÍ: validar 5.9 en tu móvil (instalar PWA + abrir offline) y firmar checklist en JOURNAL.
