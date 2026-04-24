import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import {
  createPaymentRedirect,
  PLAN_PRICES,
  PLAN_LABELS,
} from "@/lib/ipaymu";

// Indonesian phone: 08xxx, 628xxx, +628xxx — 10–15 digits total
const PHONE_RE = /^(\+?62|0)8\d{8,12}$/;

function normalizePhone(raw: string): string {
  // Ensure leading +62 format for iPaymu
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return digits;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { plan, phone } = body;

  if (!plan || !(plan in PLAN_PRICES)) {
    return NextResponse.json(
      { error: "Plan tidak valid. Pilih: starter, pro, atau lifetime." },
      { status: 400 },
    );
  }

  if (!phone || !PHONE_RE.test(phone.trim())) {
    return NextResponse.json(
      { error: "Nomor HP tidak valid. Gunakan format 08xxx atau +628xxx." },
      { status: 400 },
    );
  }

  // Block duplicate: user already has a pending order for this plan (created < 30 min ago)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  const existingPending = await db.query.orders.findFirst({
    where: (o, { eq: eqOp, and: andOp, gt }) =>
      andOp(
        eqOp(o.userId, session.user.id),
        eqOp(o.plan, plan),
        eqOp(o.status, "pending"),
        gt(o.createdAt, thirtyMinsAgo),
      ),
  });

  if (existingPending?.paymentUrl) {
    // Return existing payment URL instead of creating a new charge
    return NextResponse.json({ paymentUrl: existingPending.paymentUrl });
  }

  const orderId = randomUUID();
  const amount = PLAN_PRICES[plan]!;
  const normalizedPhone = normalizePhone(phone.trim());

  // Insert order (status: pending, no paymentUrl yet)
  await db.insert(schema.orders).values({
    id: orderId,
    userId: session.user.id,
    plan,
    amount,
    phone: normalizedPhone,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    const result = await createPaymentRedirect({
      orderId,
      plan: PLAN_LABELS[plan] ?? plan,
      amount,
      buyerName: session.user.name,
      buyerEmail: session.user.email,
      buyerPhone: normalizedPhone,
    });

    // Persist session ID + payment URL
    await db
      .update(schema.orders)
      .set({
        paymentUrl: result.paymentUrl,
        ipaymuSessionId: result.sessionId,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId));

    return NextResponse.json({ paymentUrl: result.paymentUrl });
  } catch (err) {
    console.error("[billing/subscribe] iPaymu error:", err);

    // Mark order failed so the 30-min block doesn't trap the user
    await db
      .update(schema.orders)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId));

    return NextResponse.json(
      { error: "Gagal membuat pembayaran. Coba lagi dalam beberapa saat." },
      { status: 502 },
    );
  }
}
