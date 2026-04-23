import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@mote-lab/db";
import { eq } from "drizzle-orm";
import { generateId } from "./utils";
import { logger } from "./logger";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3003",
  secret: process.env.BETTER_AUTH_SECRET!,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            if (user.email === process.env.OWNER_EMAIL) {
              await db
                .update(schema.users)
                .set({ role: "owner" })
                .where(eq(schema.users.id, user.id));
              logger.info({ userId: user.id }, "Owner role assigned");
              return;
            }

            // Create 7-day trial subscription for new users
            const trialDays = parseInt(process.env.TRIAL_DAYS ?? "7");
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

            await db.insert(schema.subscriptions).values({
              id: generateId(),
              userId: user.id,
              plan: "trial",
              status: "active",
              trialEndsAt,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            logger.info({ userId: user.id }, "Trial subscription created");
          } catch (err) {
            logger.error({ err, userId: user.id }, "Failed to setup new user");
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
