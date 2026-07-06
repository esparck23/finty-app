-- ============================================================
-- ESQUEMA SQLite para Finty (Turso)
-- ============================================================

-- Tabla de Usuarios (Soporte Autenticación Simple)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'colaborador' CHECK (role IN ('admin', 'colaborador')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla de Categorías (CRUD dinámico del Core de Finty)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'exchange')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CONSTRAINT unique_category_name_type UNIQUE (name, type)
);

-- Tabla de Transacciones (Ingresos, Egresos, Cambios)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'exchange')),
  amount_usd REAL NOT NULL DEFAULT 0,
  amount_bs REAL NOT NULL DEFAULT 0,
  currency_primary TEXT NOT NULL CHECK (currency_primary IN ('USD', 'Bs')),
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description TEXT,
  receipt_url TEXT,
  transaction_date TEXT NOT NULL DEFAULT (date('now')),
  receipt_type TEXT CHECK (receipt_type IN ('invoice', 'transfer')),
  provider_name TEXT,
  tax_id TEXT,
  document_type TEXT CHECK (document_type IN ('rif', 'ci')),
  transfer_provider TEXT,
  transfer_operation TEXT,
  original_image_url TEXT,
  processed_at TEXT,
  is_offline_sync INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla de Tasas de Cambio
CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  rate REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(date, source)
);

-- Tabla de Auditoría (Audit Log)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  old_values TEXT,
  new_values TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_receipt_type ON transactions(receipt_type);
CREATE INDEX IF NOT EXISTS idx_transactions_tax_id ON transactions(tax_id);

-- Semillas iniciales para Categorías
INSERT OR IGNORE INTO categories (name, type) VALUES
  ('Donación', 'income'),
  ('Donación en especie', 'income'),
  ('Venta de divisas', 'income'),
  ('Transferencia recibida', 'income'),
  ('Otro ingreso', 'income'),
  ('Alimentos', 'expense'),
  ('Medicamentos', 'expense'),
  ('Insumos médicos', 'expense'),
  ('Materiales de construcción', 'expense'),
  ('Transporte', 'expense'),
  ('Alquiler/Hospedaje', 'expense'),
  ('Servicios básicos', 'expense'),
  ('Equipamiento', 'expense'),
  ('Otro gasto', 'expense'),
  ('Cambio de divisas', 'exchange');

-- Triggers de Auditoría en SQLite
-- NOTA: trg_audit_delete fue eliminado porque la FK ON DELETE SET NULL
-- en audit_log entra en conflicto con el INSERT del trigger (el parent
-- ya no existe cuando el trigger intenta insertar). El DELETE audit se
-- maneja desde el API en src/app/api/transactions/[id]/route.ts.
CREATE TRIGGER IF NOT EXISTS trg_audit_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (transaction_id, user_id, action, new_values)
  VALUES (NEW.id, NEW.user_id, 'CREATE', json_object(
    'type', NEW.type,
    'amount_usd', NEW.amount_usd,
    'amount_bs', NEW.amount_bs,
    'category_id', NEW.category_id,
    'currency_primary', NEW.currency_primary
  ));
END;

CREATE TRIGGER IF NOT EXISTS trg_audit_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (transaction_id, user_id, action, old_values, new_values)
  VALUES (NEW.id, NEW.user_id, 'UPDATE',
    json_object('amount_usd', OLD.amount_usd, 'amount_bs', OLD.amount_bs, 'category_id', OLD.category_id),
    json_object('amount_usd', NEW.amount_usd, 'amount_bs', NEW.amount_bs, 'category_id', NEW.category_id)
  );
END;

-- Vista Pública de Transparencia
CREATE VIEW IF NOT EXISTS public_summary AS
SELECT
  t.type,
  c.name AS category,
  t.currency_primary,
  SUM(t.amount_usd) AS total_usd,
  SUM(t.amount_bs) AS total_bs,
  COUNT(*) AS num_transactions
FROM transactions t
JOIN categories c ON t.category_id = c.id
GROUP BY t.type, c.name, t.currency_primary;
