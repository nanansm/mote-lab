/**
 * Seed owner account.
 * Run: OWNER_EMAIL=x OWNER_PASSWORD=y npx tsx scripts/seed-owner.ts
 *
 * Or set env vars in .env.local then: npx tsx scripts/seed-owner.ts
 */
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env.local") });

import { db, schema } from "@mote-lab/db";
import { eq } from "drizzle-orm";
import { auth } from "../apps/web/src/lib/auth";

async function seedOwner() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    console.error("OWNER_EMAIL and OWNER_PASSWORD must be set");
    process.exit(1);
  }

  // Check if owner already exists
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (existing) {
    // Ensure role is owner
    if (existing.role !== "owner") {
      await db.update(schema.users).set({ role: "owner" }).where(eq(schema.users.id, existing.id));
      console.log(`Updated existing user ${email} to owner role.`);
    } else {
      console.log(`Owner account ${email} already exists.`);
    }
    process.exit(0);
  }

  // Create new owner account via better-auth
  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: "Nanan (Owner)",
    },
  });

  if (result.error) {
    console.error("Failed to create owner account:", result.error);
    process.exit(1);
  }

  // Set role to owner (the databaseHook should handle this, but do it explicitly too)
  await db.update(schema.users).set({ role: "owner" }).where(eq(schema.users.email, email));

  console.log(`Owner account created: ${email}`);
  console.log("You can now login at /login → 'Login sebagai Owner'");
  process.exit(0);
}

seedOwner().catch((err) => {
  console.error(err);
  process.exit(1);
});
