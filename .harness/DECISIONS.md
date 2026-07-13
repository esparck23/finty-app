**DECISIONS — Finty**

**DEC-001 — Crear arnés sobre proyecto en progreso
Fecha: 2025-06-10
Decisión: Implementar .harness/ con proyecto ya en Etapa 4/7
Razón: Estandarizar estado y loop de agente desde ahora
Contexto: Sin tests previos. Se añadirá Etapa 0 de tests.

**DEC-002 — proxy.ts en vez de middleware.ts
Fecha: 2026-07-03
Decisión: Usar src/proxy.ts con función exportada proxy
Razón: Next.js 16 deprecó middleware.ts
Contexto: Runtime por defecto es Node.js (no Edge)

**DEC-003 — Hash bcrypt en base64
Fecha: 2026-07-03
Decisión: Almacenar ADMIN_PASSWORD_HASH_B64 en vez de hash directo
Razón: Next.js expande los $ del hash bcrypt como variables de entorno
Contexto: Login decodifica base64 antes de comparar

**DEC-004 — trg_audit_delete dropeado
Fecha: 2026-07-03
Decisión: Eliminar trigger trg_audit_delete permanentemente
Razón: FK audit_log.transaction_id REFERENCES transactions(id) ON DELETE SET NULL se evalúa después del trigger, causando FOREIGN KEY constraint failed
Contexto: Audit DELETE ahora se hace desde código en src/app/api/transactions/[id]/route.ts

**DEC-005 — Modelo de Balance v5 (direction-split simétrico)
Fecha: 2026-07-04
Decisión: Usar modelo v5 como definitivo. No revertir a v6.
Razón: v5 es simétrico (Normal e Inverso son espejos). v6 tenía doble conteo en moneda entregada.
Contexto: Regla universal: entregado→Egreso, recibido→Ingreso. Balance = Total Ingreso - Total Egreso.

**DEC-006 — OCR sin almacenamiento externo
Fecha: 2026-07-04
Decisión: Imagen transitoria, no se persiste en R2 ni otro storage
Razón: Elimina dependencia S3, 5 env vars, vulnerabilidad SSRF, y un salto de red
Contexto: receipt_url existe en schema pero sin poblar. Decisión futura.

**DEC-007 — Cotizave como fuente primaria de tasas
Fecha: 2026-07-04
Decisión: Cotizave (BCV USD, BCV EUR, Binance P2P) con dolar-bcv-api como fallback
Razón: Documentación profesional, status page, plan free generoso (1,500 req/mes), sin JWT
Contexto: exchange_rates migrado a UNIQUE(date, source). Lazy fetch en TransactionForm.

**DEC-008 — Reapertura Etapa 4 (feedback)
Fecha: 2026-07-07
Decisión: Reabrir Etapa 4 para ajustes de dashboard/transparencia sin avanzar de etapa.
Razón: Prueba de funcionalidad no conforme.
Contexto/Feedback:
- Gráfico "Gastos por categoría (USD)": "Servicios básicos 0%" comparte línea/col con Alimentos 0% y Otro gasto 0%; solo "Transporte" se muestra aparte.
- Doble moneda en dashboard: además de USD, mostrar gastos/ingresos en Bolívares. Botones TODO/ESTE MES/etc deben reflejar gráficos para ambas monedas.
- Cards Ingresos/Egresos/Balance deben mostrar valores en USD y Bolívares.
- Transparencia: debe haber link/pestaña accesible desde navegación y un espacio de "share" en el Dashboard para compartir el acceso público a Transparencia.

**DEC-009 — Dashboard: una sola card Balance
Fecha: 2026-07-07
Decisión: Eliminar otras cards del Dashboard; dejar solo la card Balance.
Razón: Feedback: las cards añadidas en Dashboard no van.
Contexto: La card Balance del Dashboard debe ser exactamente la misma que Transacciones: mismo diseño, mismo patrón, mismo origen de datos.

**DEC-010 — Excepción instalación Vitest/rolldown en Windows
Fecha: 2026-07-07
Decisión: Reinstalar dependencias desde cero por fallo de native binding de rolldown, luego cambiar estrategia de tests a Jest.
Razón: `npx vitest` falló con `ERR_DLOPEN_FAILED` en `@rolldown/binding-win32-x64-msvc/rolldown-binding.win32-x64-msvc.node` y, tras reinstalación, persiste `TS2307` por resolución de tipos de `vite` en Windows. No es fallo de proyecto ni de código; es entorno/stack de pruebas.
Contexto/Remediación: Se eliminaron `node_modules` y `package-lock.json`, se limpió cache npm y se reinstaló. Se descarta continuar con Vitest para Etapa 0. Cuando Jest aplique y compile/ejecute, limpiar BLK-001 de `BLOCKERS.md`.

**DEC-011 — Fiabilidad de Vibe en Etapa 0
Fecha: 2026-07-07
Decisión: Marcar a Vibe como no productivo en tareas de setup largo para Etapa 0 en este proyecto; priorizar ejecución directa o Qoder para este tipo de trabajo.
Razón: Vibe no cerró Etapa 0 dentro de 8 y 20 turnos seguidos, repitiendo planning sin entrega. En Etapa 4 con Qoder sí hubo commits concretos.
Contexto: No se descarta Vibe para otras etapas. Revisar en DECISIONS.md en otro momento.

**DEC-012 — Reapertura Etapa 4 (feedback 2)
Fecha: 2026-07-07
Decisión: Reabrir Etapa 4 para ajustes visuales/funcionales de Dashboard y Transparencia.
Razón: Prueba de funcionalidad no conforme.
Contexto/Feedback:
1. Gastos por categoría (Bs): en móviles el porcentaje no se ve; el gráfico es demasiado grande para el cuadro.
2. Ingresos vs Egresos (Bs): eje/fecha debe mostrar MM/AAAA en español y con letras, por ejemplo "Junio 2026".
3. Moneda gráficos: etiqueta actual sin sentido; texto debe decir exactamente "Gráficos según tipo de moneda:" y opciones "USD", "Bs".
4. Falta buscador inteligente y botón exportar PDF en Transparencia. Queda anotado aparte como futuro; no bloquear Etapa 4 por esto.
5. "/transparencia": eliminar texto innecesario "Datos extraídos directamente de la base de datos Finty".

**DEC-013 — Reapertura Etapa 4 (feedback 3, Transparencia + Dashboard share)
Fecha: 2026-07-07
Decisión: Reabrir Etapa 4 para ajustes visuales/funcionales de la página /transparencia (y el cintillo de share del Dashboard).
Razón: Prueba de funcionalidad no conforme en el listado público de Transparencia.
Contexto/Feedback (punto a punto, uno a uno, para Qoder):
1. El cintillo para copiar el enlace público de transparencia está bien hecho pero MAL UBICADO. Reubicar correctamente tanto para Móvil como para Desktop.
2. Filtros: unificar todos en UN SOLO select list. Cambiar etiqueta "Personalizado" por "Rango de fechas". Por defecto debe quedar seleccionado "Todos".
3. Para móvil y desktop: debe haber un FOOTER, así sea solo un separador, para dar distancia entre el fin del contenido y el fin de la pantalla (móvil).
4. En la lista de Transparencia, la columna "#" no tiene razón de existir. O se convierte en un índice real de items (1, 2, 3...) o se elimina.
5. Añadir PAGINACIÓN al listado de transparencia, con el MISMO modelo ya aplicado a Transacciones y Categorías.
6. (ANOTADO APARTE — NO implementar en esta etapa) Buscador inteligente + botón exportar PDF en Transparencia. Referenciado por el usuario como "punto 9". Diferido a Etapa 6 (Reportes) según DEC-012 p4. No bloquear Etapa 4 por esto.
Nota de alcance: los puntos 1-5 son los ejecutables ahora. El punto 6 queda registrado pero fuera de alcance hasta Etapa 6.

**DEC-014 — Reapertura Etapa 4 (feedback 4, alcance global + navegación)
Fecha: 2026-07-07
Decisión: Reabrir Etapa 4 para corregir alcance de cambios de DEC-013 y comportamiento de navegación en /transparencia.
Razón: Los cambios de DEC-013 se aplicaron con alcance incorrecto (solo en /transparencia) y falta distinguir visitante externo vs usuario del sistema.
Contexto/Feedback (punto a punto, para Qoder):
1. El FOOTER (separador) aplicado en DEC-013 p3 solo está en /transparencia. Debe aplicarse a TODA la aplicación (layout global), no solo a esa página.
2. El SELECT de filtros/rango (DEC-013 p2) se aplicó a /transparencia pero NO al /dashboard, donde es donde realmente se necesita. El dashboard debe tener el mismo control de periodo (Todos / Este mes / 3 meses / Este año / Rango de fechas) que alimente sus gráficos y stats.
3. /transparencia es un enlace público, pero la app debe reconocer cuándo el visitante viene DEL SISTEMA (sesión autenticada) vs externo (anónimo). Si viene del sistema, seguir mostrando el panel de navegación lateral (Sidebar) en /transparencia; si es externo, mantener la vista pública sin sidebar.
Regla de ejecución obligatoria para Qoder: PROBAR (npm run build + revisión funcional) ANTES de hacer cualquier commit. No commitear sin verificación.
Nota de alcance: no tocar la sección "No tocar" de STATE.md. Respetar rama feature/* (usar agentpc-dev existente).

**DEC-015 — Ajustes post-preview DEC-014 (sobre última versión en agentpc-dev / PR #4)
Fecha: 2026-07-07
Decisión: Seguir trabajando en agentpc-dev (NO mergear aún). Corregir 3 detalles detectados en preview de Vercel.
Razón: Prueba en preview no conforme tras DEC-014.
Contexto/Feedback (punto a punto, para Qoder):
1. Hay DOS footer visibles (se duplicaron: uno en layout raíz y otro en AppShell, o layout + página). Dejar UNO SOLO y que sea el FIJO (persistente en pantalla, no solo al final del scroll). Eliminar el duplicado.
2. La funcionalidad de FILTRO implementada en /transparencia (select unificado Todos / Este mes / 3 meses / Este año / Rango de fechas que recarga datos vía API con from/to) debe implementarse IGUAL en /dashboard, alimentando sus gráficos y stats. No basta con alinear etiquetas (DEC-014 p2): el dashboard debe tener el mismo control funcional de periodo que /transparencia, no solo los botones previos.
3. Móviles: en el cintillo de compartir URL de transparencia, no basta con el ícono de copiar; debe haber un TÍTULO o TEXTO indicativo (ej. "Compartir enlace público") visible también en móvil, no solo el ícono.
Regla de ejecución obligatoria para Qoder: PROBAR (npm run build + revisión funcional) ANTES de hacer cualquier commit. No commitear sin verificación.

**DEC-016 — Corrección de punto de verdad en /transparencia (feedback 6)
Fecha: 2026-07-07
Decisión: Reabrir Etapa 4 para corregir que las cards de /transparencia no reflejan los cálculos correctamente.
Razón: Las cards de /transparencia deben ser un espejo fiel de los datos reales; al ser "transparencia", ambos (Transacciones y Transparencia) deben reflejar un MISMO punto de verdad.
Contexto/Feedback (para Qoder):
- Las cards de Totales (Ingresos / Egresos / Balance / Transacciones) en /transparencia NO coinciden con los cálculos reales de la página de Transacciones.
- Acción: COMPARAR los cálculos de /transparencia contra los de Transacciones (misma fuente/lógica de agregación). Ambos deben dar el mismo resultado (mismo punto de verdad).
- Investigar de dónde vienen los números de cada uno: /transparencia usa /api/public/summary (vista public_summary o consulta agregada) y Transacciones usa el listado real de transacciones. Si difieren por la consulta SQL, el modelo de agregación, el filtro de moneda, o el tratamiento de direction-split (Balance v5: entregado→Egreso, recibido→Ingreso), corregir para que coincidan.
- Regla universal del proyecto: Balance = Total Ingreso - Total Egreso (modelo v5, no revertir a v6).
Regla de ejecución obligatoria para Qoder: PROBAR (npm run build + revisión funcional comparando ambas páginas) ANTES de commitear. No commitear sin verificación.

**DEC-017 — Ajustes post-preview DEC-016 (feedback 7)
Fecha: 2026-07-07
Decisión: Seguir trabajando en agentpc-dev (NO mergear aún). Corregir 2 detalles detectados en preview de Vercel tras DEC-016.
Razón: Prueba en preview no conforme.
Contexto/Feedback (para Qoder):
1. PAGINACIÓN de la TABLA en /transparencia: la tabla solo muestra 10 items (registros) mientras la card de total dice #27 Transacciones. Debe implementarse la paginación en la TABLA de /transparencia que refleje el 100% de las transacciones. PROBAR que el total de transacciones efectivamente se esté paginando después de los 10 items.
2. CARDS en móvil: el texto (números) en Bolívares (Bs) sobrepasa el tamaño de la card en móvil y rompe el UX. Corregir para que el valor en Bs no desborde en móvil.
Regla de ejecución obligatoria para Qoder: PROBAR (npm run build + revisión funcional) ANTES de commitear. No commitear sin verificación.

**DEC-018 — Arranque Etapa 0 (Harness de Tests) con Jest
Fecha: 2026-07-08
Decisión: Iniciar Etapa 0 migrando de Vitest a Jest. Qwen limpia todo lo relativo a Vitest y prepara el andamiaje de tests con Jest.
Razón: BLK-001 (Vitest no resuelve tipos de Vite en Windows) no se resolvió tras reinstalación limpia; DEC-010 ya descartó Vitest en este proyecto. Jest funciona bien en Windows sin depender del pipeline de Vite/rolldown.
Contexto/Feedback (para Qwen):
- ELIMINAR todo rastro de Vitest: desinstalar `vitest` (y `@vitest/*`, `vitest.config.ts` si existe), quitar scripts de `package.json` que invoquen vitest, y remover cualquier config/tsconfig que lo referencie.
- PREPARAR Jest para Next.js 16 + TypeScript: instalar `jest`, `ts-jest` (o `@swc/jest`), `@types/jest`, `jest-environment-jsdom` (para componentes React) y `babel`/preset si aplica. Configurar `jest.config.ts` (o `jest.config.js`) con `testEnvironment: 'jsdom'`, transform de TS, y `moduleNameMapper` para alias `@/` → `src/`.
- Añadir script `npm test` en `package.json` (ej. `jest`).
- Crear 1 test de ejemplo mínimo y EJECUTABLE que pase (puede ser unitario puro, sin DB, ej. util de formato en `src/lib/utils/currency.ts` o un smoke test de componente).
- VERIFICAR: `npm test` corre y pasa; `npm run build` sigue verde; no romper código existente.
- REGLA: no tocar la sección "No tocar" de STATE.md (trg_audit_delete, modelo Balance v5, receipt_url, middleware.ts). Rama `agentpc-dev`, sin force push, commits pequeños.
- NO mergear a main aún; entregar en agentpc-dev para revisión humana.

## DEC-019 (2026-07-11) — Etapa 5.2 IndexedDB offline queue
- Alcance: `src/lib/offline/db.ts` — store IndexedDB de transacciones creadas offline con flag `is_offline_sync=0`.
- Criterio de aceptación: test Jest que inserta y lee un registro offline; `npm run build` verde; `npx tsc --noEmit` 0 errores.
- No tocar: rutas API, proxy.ts, middleware, ni el SW de 5.1.
- Orquestación: motor A2A Factory (Qwen→Vibe→Pi si falla). Hermes registra y espera gate humano para commit.

## DEC-020 (2026-07-11) — Etapa 5.3 Background sync
- Alcance: extender src/app/sw.ts (de 5.1) con sync en segundo plano; usar db.ts (5.2): getOfflineTransactions() + markSynced(id).
- Comportamiento: al recuperar conexión, POST cola a /api/transactions y marcar is_offline_sync=true.
- Criterio: test online→offline→online verifica flag=1; build verde.
- No tocar rutas API, proxy, middleware.
- Ejecución: motor A2A Factory (Qwen→Vibe→Pi). Hermes verifica en disco y espera gate humano.
