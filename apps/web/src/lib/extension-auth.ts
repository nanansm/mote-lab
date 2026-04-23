import { createHash, randomBytes } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db, schema } from "@mote-lab/db";
import { PLAN_LIMITS } from "@mote-lab/shared";

export function generateRawToken(): string {
  return randomBytes(64).toString("hex"); // 128-char hex
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export type TokenUser = {
  userId: string;
  email: string;
  name: string;
  plan: string;
};

export async function validateExtensionToken(
  rawToken: string,
): Promise<TokenUser | null> {
  const hashed = hashToken(rawToken);
  const now = new Date();

  const row = await db.query.extensionTokens.findFirst({
    where: and(
      eq(schema.extensionTokens.token, hashed),
      gt(schema.extensionTokens.expiresAt, now),
    ),
  });

  if (!row) return null;

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, row.userId),
  });

  if (!user) return null;

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, row.userId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  // Fire-and-forget last_used_at update
  db.update(schema.extensionTokens)
    .set({ lastUsedAt: now })
    .where(eq(schema.extensionTokens.id, row.id))
    .catch(() => {});

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: subscription?.plan ?? "trial",
  };
}

export type QuotaState = {
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  resetAt: string;
};

export async function checkAndIncrementQuota(
  userId: string,
  plan: string,
  increment = 1,
): Promise<QuotaState> {
  const limits = PLAN_LIMITS as Record<string, { dailyLimit: number }>;
  const dailyLimit = limits[plan]?.dailyLimit ?? 100;

  // Date in WIB (UTC+7)
  const now = new Date();
  const wibOffset = 7 * 60 * 60 * 1000;
  const wibDate = new Date(now.getTime() + wibOffset);
  const todayWIB = wibDate.toISOString().split("T")[0]!; // YYYY-MM-DD

  // Midnight WIB reset time
  const todayParts = todayWIB.split("-");
  const y = parseInt(todayParts[0]!, 10);
  const m = parseInt(todayParts[1]!, 10);
  const d = parseInt(todayParts[2]!, 10);
  const midnightWIB = new Date(Date.UTC(y, m - 1, d + 1) - wibOffset);

  const existing = await db.query.usageQuota.findFirst({
    where: and(
      eq(schema.usageQuota.userId, userId),
      eq(schema.usageQuota.date, todayWIB),
    ),
  });

  const used = existing?.researchCount ?? 0;
  const allowed = dailyLimit >= 999999 || used < dailyLimit;

  if (allowed && increment > 0) {
    if (existing) {
      await db
        .update(schema.usageQuota)
        .set({ researchCount: used + increment })
        .where(
          and(
            eq(schema.usageQuota.userId, userId),
            eq(schema.usageQuota.date, todayWIB),
          ),
        );
    } else {
      const { randomUUID } = await import("crypto");
      await db
        .insert(schema.usageQuota)
        .values({
          id: randomUUID(),
          userId,
          date: todayWIB,
          researchCount: increment,
        })
        .onConflictDoUpdate({
          target: [schema.usageQuota.userId, schema.usageQuota.date],
          set: { researchCount: used + increment },
        });
    }
  }

  const newUsed = allowed ? used + increment : used;
  const remaining = Math.max(0, dailyLimit - newUsed);

  return {
    used: newUsed,
    limit: dailyLimit,
    remaining,
    allowed,
    resetAt: midnightWIB.toISOString(),
  };
}

export async function getQuotaState(
  userId: string,
  plan: string,
): Promise<QuotaState> {
  return checkAndIncrementQuota(userId, plan, 0);
}
