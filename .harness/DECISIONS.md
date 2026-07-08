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

**DEC-007 — Cotizave como fuente primaria de tasas**
Fecha: 2026-07-04
Decisión: Cotizave (BCV USD, BCV EUR, Binance P2P) con dolar-bcv-api como fallback
Razón: Documentación profesional, status page, plan free generoso (1,500 req/mes), sin JWT
Contexto: exchange_rates migrado a UNIQUE(date, source). Lazy fetch en TransactionForm.

**DEC-008 — Reapertura Etapa 4 (feedback)**
Fecha: 2026-07-07
Decisión: Reabrir Etapa 4 para ajustes de dashboard/transparencia sin avanzar de etapa.
Razón: Prueba de funcionalidad no conforme.
Contexto/Feedback:
- Gráfico "Gastos por categoría (USD)": "Servicios básicos 0%" comparte línea/col con Alimentos 0% y Otro gasto 0%; solo "Transporte" se muestra aparte.
- Doble moneda en dashboard: además de USD, mostrar gastos/ingresos en Bolívares. Botones TODO/ESTE MES/etc deben reflejar gráficos para ambas monedas.
- Cards Ingresos/Egresos/Balance deben mostrar valores en USD y Bolívares.
- Transparencia: debe haber link/pestaña accesible desde navegación y un espacio de "share" en el Dashboard para compartir el acceso público a Transparencia.

**DEC-009 — Dashboard: una sola card Balance**
Fecha: 2026-07-07
Decisión: Eliminar otras cards del Dashboard; dejar solo la card Balance.
Razón: Feedback: las cards añadidas en Dashboard no van.
Contexto: La card Balance del Dashboard debe ser exactamente la misma que Transacciones: mismo diseño, mismo patrón, mismo origen de datos.

**DEC-010 — Excepción instalación Vitest/rolldown en Windows**
Fecha: 2026-07-07
Decisión: Reinstalar dependencias desde cero por fallo de native binding de rolldown, luego cambiar estrategia de tests a Jest.
Razón: `npx vitest` falló con `ERR_DLOPEN_FAILED` en `@rolldown/binding-win32-x64-msvc/rolldown-binding.win32-x64-msvc.node` y, tras reinstalación, persiste `TS2307` por resolución de tipos de `vite` en Windows. No es fallo de proyecto ni de código; es entorno/stack de pruebas.
Contexto/Remediación: Se eliminaron `node_modules` y `package-lock.json`, se limpió cache npm y se reinstaló. Se descarta continuar con Vitest para Etapa 0. Cuando Jest aplique y compile/ejecute, limpiar BLK-001 de `BLOCKERS.md`.

**DEC-011 — Fiabilidad de Vibe en Etapa 0**
Fecha: 2026-07-07
Decisión: Marcar a Vibe como no productivo en tareas de setup largo para Etapa 0 en este proyecto; priorizar ejecución directa o Qoder para este tipo de trabajo.
Razón: Vibe no cerró Etapa 0 dentro de 8 y 20 turnos seguidos, repitiendo planning sin entrega. En Etapa 4 con Qoder sí hubo commits concretos.
Contexto: No se descarta Vibe para otras etapas. Revisar en DECISIONS.md en otro momento.