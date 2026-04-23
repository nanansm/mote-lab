#!/usr/bin/env node
/**
 * Seed owner account.
 * Creates the owner user record with role='owner' if not exists.
 * Owner login is via /control-panel/login — password is in OWNER_PASSWORD env, not in DB.
 *
 * Run: DATABASE_URL=... OWNER_EMAIL=... node scripts/seed-owner.mjs
 * Or set env vars in .env.local / Easypanel, then: node scripts/seed-owner.mjs
 */
import postgres from "postgres";
import { randomUUID } from "crypto";

const ownerEmail = process.env.OWNER_EMAIL;
const databaseUrl = process.env.DATABASE_URL;

if (!ownerEmail) {
  console.error("[seed-owner] OWNER_EMAIL is required");
  process.exit(1);
}
if (!databaseUrl) {
  console.error("[seed-owner] DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10 });

try {
  const [existing] = await sql`
    SELECT id, role FROM users WHERE email = ${ownerEmail} LIMIT 1
  `;

  if (existing) {
    if (existing.role !== "owner") {
      await sql`
        UPDATE users SET role = 'owner', updated_at = NOW() WHERE id = ${existing.id}
      `;
      console.log(`[seed-owner] ✓ Updated existing user to role=owner: ${ownerEmail}`);
    } else {
      console.log(`[seed-owner] ✓ Owner already exists: ${ownerEmail}`);
    }
  } else {
    const id = randomUUID();
    await sql`
      INSERT INTO users (id, name, email, email_verified, role, created_at, updated_at)
      VALUES (${id}, 'Owner', ${ownerEmail}, true, 'owner', NOW(), NOW())
    `;
    console.log(`[seed-owner] ✓ Owner seeded: ${ownerEmail}`);
    console.log(`[seed-owner] Login at /control-panel/login with OWNER_PASSWORD env value`);
  }
} catch (err) {
  console.error("[seed-owner] Failed:", err.message ?? err);
  process.exit(1);
} finally {
  await sql.end();
}
