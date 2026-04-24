import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { generateId } from "@/lib/utils";
import { RECURRING_PLANS } from "@/lib/ipaymu";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: orderId } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.id, orderId),
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  if (order.status === "paid" || order.status === "manual_approved") {
    return NextResponse.json({ error: "Order sudah diproses" }, { status: 400 });
  }

  try {
    await db.transaction(async (tx) => {
      const now = new Date();

      await tx
        .update(schema.orders)
        .set({ status: "manual_approved", paidAt: now, updatedAt: now })
        .where(eq(schema.orders.id, orderId));

      const currentPeriodEnd = RECURRING_PLANS.has(order.plan)
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;

      const existing = await tx.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.userId, order.userId),
        orderBy: (s, { desc: d }) => [d(s.createdAt)],
      });

      if (existing) {
        await tx
          .update(schema.subscriptions)
          .set({
            plan: order.plan,
            status: "active",
            currentPeriodEnd,
            trialEndsAt: null,
            ipaymuInvoiceId: order.id,
            updatedAt: now,
          })
          .where(eq(schema.subscriptions.id, existing.id));
      } else {
        await tx.insert(schema.subscriptions).values({
          id: generateId(),
          userId: order.userId,
          plan: order.plan,
          status: "active",
          currentPeriodEnd,
          trialEndsAt: null,
          ipaymuInvoiceId: order.id,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    console.log(`[owner/approve] order ${orderId} manually approved by ${session.user.id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[owner/approve] transaction failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
