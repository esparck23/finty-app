import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const envPath = join(rootDir, ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.substring(0, eqIdx);
  const val = trimmed.substring(eqIdx + 1);
  if (!process.env[key]) process.env[key] = val;
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrations = [
  "ALTER TABLE transactions ADD COLUMN receipt_type TEXT",
  "ALTER TABLE transactions ADD COLUMN provider_name TEXT",
  "ALTER TABLE transactions ADD COLUMN tax_id TEXT",
  "ALTER TABLE transactions ADD COLUMN document_type TEXT",
  "ALTER TABLE transactions ADD COLUMN transfer_provider TEXT",
  "ALTER TABLE transactions ADD COLUMN transfer_operation TEXT",
  "ALTER TABLE transactions ADD COLUMN original_image_url TEXT",
  "ALTER TABLE transactions ADD COLUMN processed_at TEXT",
  "CREATE INDEX IF NOT EXISTS idx_transactions_receipt_type ON transactions(receipt_type)",
  "CREATE INDEX IF NOT EXISTS idx_transactions_tax_id ON transactions(tax_id)",
];

async function main() {
  console.log("Migración 003: Campos adicionales OCR\n");

  for (const sql of migrations) {
    try {
      await db.execute(sql);
      const preview = sql.substring(0, 70);
      console.log(`  OK: ${preview}...`);
    } catch (err) {
      if (err.message?.includes("duplicate column")) {
        const preview = sql.substring(0, 70);
        console.log(`  SKIP (ya existe): ${preview}...`);
      } else {
        console.error(`  FAIL: ${sql.substring(0, 70)}...`);
        console.error(`  ${err.message}`);
      }
    }
  }

  const cols = await db.execute("PRAGMA table_info(transactions)");
  console.log(`\nColumnas en transactions: ${cols.rows.length}`);
  cols.rows.forEach((r) => console.log(`  - ${r.name} (${r.type})`));

  console.log("\nMigración completada.");
  db.close();
}

main().catch(console.error);
