🟢 Salud: Verde
Hecho: 5.9 — Bugs de prueba manual corregidos (4 hallazgos: offline transacciones/categorías, OCR offline, menú transparencia, recarga offline).
🔜 Sigue: Re-validar 5.9 en móvil (firmar checklist) y cerrar Etapa 5.
Acción / Scope: tras merge de los fixes, re-probar en preview: registrar/editar offline, OCR bloqueado offline, menú transparencia persistente, recarga offline sirve app.
Criterio medible: checklist 5.9 firmado en JOURNAL; build verde; tsc 0 errores; 18 tests OK.
⚠️ Riesgo: bajo; la cola offline depende de background sync del navegador (fallback por mensaje al SW incluido).
No tocar: rutas API (salvo /api/auth/me nuevo), public/sw.js (generado).
¿Acción tuya?: SÍ: re-validar 5.9 en preview y firmar checklist.
