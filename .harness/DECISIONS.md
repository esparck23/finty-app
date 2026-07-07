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