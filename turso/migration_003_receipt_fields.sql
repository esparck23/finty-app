-- Migración: Campos adicionales para OCR (Plan de Viabilidad)
-- Fecha: 2026-07-05
-- Ejecutar en Turso remoto via: turso db shell <db-name> < este_archivo.sql

ALTER TABLE transactions ADD COLUMN receipt_type TEXT CHECK (receipt_type IN ('invoice', 'transfer'));
ALTER TABLE transactions ADD COLUMN provider_name TEXT;
ALTER TABLE transactions ADD COLUMN tax_id TEXT;
ALTER TABLE transactions ADD COLUMN document_type TEXT CHECK (document_type IN ('rif', 'ci'));
ALTER TABLE transactions ADD COLUMN transfer_provider TEXT;
ALTER TABLE transactions ADD COLUMN transfer_operation TEXT;
ALTER TABLE transactions ADD COLUMN original_image_url TEXT;
ALTER TABLE transactions ADD COLUMN processed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_receipt_type ON transactions(receipt_type);
CREATE INDEX IF NOT EXISTS idx_transactions_tax_id ON transactions(tax_id);
