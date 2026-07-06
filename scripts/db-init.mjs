import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const dbUrl = process.env.TURSO_DATABASE_URL ?? "file:./data/finty.db";

const db = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const schemaPath = join(rootDir, "turso", "schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  // Filter out comment lines
  const cleaned = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .filter((line) => line.trim() !== "")
    .join("\n");

  // Set WAL mode (required for Turso uploads)
  await db.execute("PRAGMA journal_mode=WAL;");
  console.log("journal_mode: WAL");

  try {
    const result = await db.executeMultiple(cleaned);
    console.log("Base de datos inicializada correctamente.");
    if (result) console.log(result);
  } catch (err) {
    console.error("Error ejecutando el schema completo:", err.message);
    console.log("\nFallback: ejecutando sentencia por sentencia...");

    // Simple state-machine splitter that handles BEGIN...END blocks
    const tokens = splitSqlStatements(cleaned);
    for (const stmt of tokens) {
      try {
        await db.execute(stmt);
      } catch (e) {
        const preview = stmt.split("\n")[0].trim().substring(0, 80);
        if (e.message?.includes("already exists")) {
          console.log(`  SKIP: ${preview}...`);
        } else {
          console.error(`  FAIL: ${preview}...`);
          console.error(e.message);
        }
      }
    }
    console.log("\nProceso completado.");
  }

  // Verify tables
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("\nTablas creadas:");
  tables.rows.forEach((r) => console.log(`  - ${r.name}`));

  const triggers = await db.execute("SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name");
  console.log("\nTriggers creados:");
  triggers.rows.forEach((r) => console.log(`  - ${r.name}`));

  const categories = await db.execute("SELECT name, type FROM categories ORDER BY type, name");
  console.log(`\nCategorías sembradas: ${categories.rows.length}`);
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let stringChar = null;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const prev = i > 0 ? sql[i - 1] : "";

    // Toggle string state
    if ((ch === "'" || ch === '"') && prev !== "\\") {
      if (inString && ch === stringChar) {
        inString = false;
        stringChar = null;
      } else if (!inString) {
        inString = true;
        stringChar = ch;
      }
    }

    if (!inString) {
      if (ch === "B" && sql.substring(i, i + 5) === "BEGIN") depth++;
      if (ch === "E" && sql.substring(i, i + 3) === "END") depth--;
      if (ch === ";" && depth === 0) {
        const trimmed = (current + ch).trim();
        if (trimmed.length > 0) {
          statements.push(trimmed);
        }
        current = "";
        continue;
      }
    }

    current += ch;
  }

  // Catch any remaining statement
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

main().catch(console.error);
