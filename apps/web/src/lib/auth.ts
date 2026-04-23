import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@mote-lab/db";
import { eq } from "drizzle-orm";
import { generateId } from "./utils";

const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3003";
const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET!,

  // Allow the production domain to make cross-origin auth requests (CSRF protection)
  trustedOrigins: [appUrl],

  advanced: {
    // Required for session cookies to be sent over HTTPS in production
    useSecureCookies: isProduction,
    crossSubDomainCookies: { enabled: false },
  },

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
        before: async (user) => {
          console.log("[better-auth-signin] user create attempt:", { email: user.email });
          return { data: user };
        },
        after: async (user) => {
          try {
            if (user.email === process.env.OWNER_EMAIL) {
              await db
                .update(schema.users)
                .set({ role: "owner" })
                .where(eq(schema.users.id, user.id));
              console.log("[better-auth-signin] owner role assigned:", user.email);
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
            console.log("[better-auth-signin] trial subscription created for:", user.email);
          } catch (err) {
            console.error("[better-auth-error] failed to setup new user:", {
              email: user.email,
              userId: user.id,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
