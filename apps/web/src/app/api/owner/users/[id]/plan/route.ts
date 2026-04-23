import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { generateId } from "@/lib/utils";

const VALID_PLANS = ["trial", "starter", "pro", "lifetime"] as const;
type Plan = (typeof VALID_PLANS)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  // Verify user exists
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }
  if ((user as { role?: string }).role === "owner") {
    return NextResponse.json({ error: "Tidak bisa mengubah plan owner" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { action, plan, days } = body as { action?: string; plan?: string; days?: number };

  // Get the user's most recent subscription
  const existing = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
    orderBy: desc(schema.subscriptions.createdAt),
  });

  const now = new Date();

  if (action === "change") {
    if (!plan || !VALID_PLANS.includes(plan as Plan)) {
      return NextResponse.json({ error: "Plan tidak valid" }, { status: 400 });
    }

    const trialEndsAt =
      plan === "trial"
        ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        : null;
    const currentPeriodEnd =
      plan === "starter" || plan === "pro"
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;

    if (existing) {
      await db
        .update(schema.subscriptions)
        .set({ plan, status: "active", trialEndsAt, currentPeriodEnd, updatedAt: now })
        .where(eq(schema.subscriptions.id, existing.id));
    } else {
      await db.insert(schema.subscriptions).values({
        id: generateId(),
        userId,
        plan,
        status: "active",
        trialEndsAt,
        currentPeriodEnd,
        createdAt: now,
        updatedAt: now,
      });
    }
  } else if (action === "extend") {
    if (!existing) {
      return NextResponse.json({ error: "User belum memiliki subscription" }, { status: 400 });
    }

    const extendDays = typeof days === "number" && days > 0 ? days : 30;
    const msToAdd = extendDays * 24 * 60 * 60 * 1000;

    if (existing.plan === "trial") {
      const base = existing.trialEndsAt ?? now;
      const newDate = new Date(Math.max(base.getTime(), now.getTime()) + msToAdd);
      await db
        .update(schema.subscriptions)
        .set({ trialEndsAt: newDate, status: "active", updatedAt: now })
        .where(eq(schema.subscriptions.id, existing.id));
    } else {
      const base = existing.currentPeriodEnd ?? now;
      const newDate = new Date(Math.max(base.getTime(), now.getTime()) + msToAdd);
      await db
        .update(schema.subscriptions)
        .set({ currentPeriodEnd: newDate, status: "active", updatedAt: now })
        .where(eq(schema.subscriptions.id, existing.id));
    }
  } else if (action === "cancel") {
    if (!existing) {
      return NextResponse.json({ error: "User belum memiliki subscription" }, { status: 400 });
    }
    await db
      .update(schema.subscriptions)
      .set({ status: "cancelled", updatedAt: now })
      .where(eq(schema.subscriptions.id, existing.id));
  } else {
    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
