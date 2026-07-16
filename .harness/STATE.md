🟢 Salud: 🟢 Salud: Verde
Hecho: 
🔜 Sigue: Próxima iteración desde prompt cargado.
Acción / Scope: Modificar src/app/layout.tsx para inyectar metas iOS en <head> (apple-mobile-web-app-capable ya viene vía metadata.appleWebApp.capable; asegurar apple-mobile-web-app-status-bar-style explícito + apple-touch-icon). NO reescribir layout.
Criterio medible: layout.tsx contiene `apple-mobile-web-app-capable` y `apple-touch-icon` (o equivalente inyectado); build verde; tsc 0 errores; 17+ tests pasando.
⚠️ Riesgo: Compilation error: [WinError 2] El sistema no puede encontrar el archivo especificado
No tocar: rutas API, proxy.ts, middleware, public/sw.js (generado), sw.ts.
¿Acción tuya?: SÍ

\1./sandbox (Quality Gate FAILED)