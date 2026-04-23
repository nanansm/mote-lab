#!/usr/bin/env node
/**
 * Production startup: run DB migrations then start Next.js server.
 * Runs inside the Docker container via CMD.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[startup] DATABASE_URL is required");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, connect_timeout: 10 });
  const db = drizzle(sql);

  try {
    const migrationsFolder = path.join(__dirname, "../packages/db/drizzle");
    console.log("[startup] Running database migrations...");
    await migrate(db, { migrationsFolder });
    console.log("[startup] Migrations complete.");
  } finally {
    await sql.end();
  }
}

async function main() {
  await runMigrations();

  // Start Next.js standalone server
  const server = spawn("node", ["apps/web/server.js"], {
    stdio: "inherit",
    env: process.env,
  });

  server.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error("[startup] Fatal error:", err);
  process.exit(1);
});
