import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@mote-lab/db";
import { generateId } from "@/lib/utils";
import { RECURRING_PLANS, fetchTransactionStatus } from "@/lib/ipaymu";

// iPaymu sends status_code "2" for successful payment
const SUCCESS_STATUS_CODE = "2";

// iPaymu success status codes from /api/v2/transaction
const SUCCESS_TRX_CODES = new Set([1, 6, 7]); // Berhasil, Berhasil-Unsettled, Escrow

// ─── Parse form-urlencoded safely ─────────────────────────────────────────────
function parseFormBody(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of text.split("&")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = decodeURIComponent(pair.slice(0, idx).replace(/\+/g, " "));
    const val = decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, " "));
    out[key] = val;
  }
  return out;
}

export async function POST(request: NextRequest) {
  // ── 1. Read raw body first — log it regardless of what happens next ──────────
  const rawBody = await request.text();

  const logId = randomUUID();
  const parsed = parseFormBody(rawBody);
  const trxId = parsed.trx_id ?? null;

  // Always insert webhook log before any processing
  await db.insert(schema.webhookLogs).values({
    id: logId,
    source: "ipaymu",
    rawBody,
    parsedData: parsed as Record<string, unknown>,
    trxId,
    status: "received",
    createdAt: new Date(),
  });

  // ── 2. Idempotency: already processed this trx_id? ───────────────────────────
  if (trxId) {
    const prior = await db.query.webhookLogs.findFirst({
      where: (wl, { eq: eqOp, and: andOp, not }) =>
        andOp(eqOp(wl.trxId, trxId), eqOp(wl.status, "processed"), not(eqOp(wl.id, logId))),
    });
    if (prior) {
      await db
        .update(schema.webhookLogs)
        .set({ status: "processed", processedAt: new Date(), errorMessage: "duplicate — already handled" })
        .where(eq(schema.webhookLogs.id, logId));
      return NextResponse.json({ ok: true, note: "duplicate" });
    }
  }

  // ── 3. Validate required fields ───────────────────────────────────────────────
  const { status_code, reference_id } = parsed;

  if (!status_code || !reference_id) {
    await markLog(logId, "error", "missing status_code or reference_id");
    return NextResponse.json({ ok: false, error: "bad payload" }, { status: 400 });
  }

  // ── 4. Only act on successful payment ────────────────────────────────────────
  if (status_code !== SUCCESS_STATUS_CODE) {
    // Log pending/failed callbacks but take no subscription action
    await markLog(logId, "processed", `status_code=${status_code} — no action needed`);
    return NextResponse.json({ ok: true });
  }

  // ── 5. Find order by reference_id ────────────────────────────────────────────
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.id, reference_id),
  });

  if (!order) {
    await markLog(logId, "error", `order not found: ${reference_id}`);
    return NextResponse.json({ ok: false, error: "order not found" }, { status: 404 });
  }

  if (order.status === "paid") {
    // Order already activated (e.g. duplicate webhook delivery)
    await markLog(logId, "processed", "order already paid — skipping");
    return NextResponse.json({ ok: true, note: "already paid" });
  }

  // ── 6. Server-side verification — iPaymu sends NO signature in webhooks ───────
  // We call /api/v2/transaction to confirm status directly from iPaymu's API.
  if (!trxId) {
    await markLog(logId, "error", "missing trx_id — cannot verify");
    return NextResponse.json({ ok: false, error: "missing trx_id" }, { status: 400 });
  }

  let verified: Awaited<ReturnType<typeof fetchTransactionStatus>>;
  try {
    verified = await fetchTransactionStatus(trxId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markLog(logId, "error", `transaction verify failed: ${msg}`);
    return NextResponse.json({ error: "could not verify transaction" }, { status: 502 });
  }

  if (!SUCCESS_TRX_CODES.has(verified.statusCode)) {
    await markLog(
      logId,
      "error",
      `transaction not successful: statusCode=${verified.statusCode} status="${verified.status}"`,
    );
    return NextResponse.json({ ok: false, error: "transaction not successful" }, { status: 400 });
  }

  // ── 7. Verify amount from API response (more reliable than webhook field) ─────
  if (verified.amount !== order.amount) {
    await markLog(
      logId,
      "error",
      `amount mismatch: expected ${order.amount}, got ${verified.amount} (from API)`,
    );
    return NextResponse.json({ ok: false, error: "amount mismatch" }, { status: 400 });
  }

  // ── 8. DB transaction: update order + upsert subscription ────────────────────
  try {
    await db.transaction(async (tx) => {
      const now = new Date();

      // Mark order paid
      await tx
        .update(schema.orders)
        .set({
          status: "paid",
          ipaymuTrxId: trxId,
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(schema.orders.id, order.id));

      // Calculate subscription period end
      const currentPeriodEnd = RECURRING_PLANS.has(order.plan)
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : null; // lifetime — never expires

      // Upsert subscription: update existing or insert new
      const existing = await tx.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.userId, order.userId),
        orderBy: (s, { desc }) => [desc(s.createdAt)],
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

    await markLog(logId, "processed");
    console.log(
      `[billing/webhook] order ${order.id} paid — user ${order.userId} upgraded to ${order.plan}`,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[billing/webhook] transaction failed:", err);
    await markLog(logId, "error", msg);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
async function markLog(id: string, status: string, errorMessage?: string) {
  await db
    .update(schema.webhookLogs)
    .set({
      status,
      processedAt: new Date(),
      ...(errorMessage ? { errorMessage } : {}),
    })
    .where(eq(schema.webhookLogs.id, id));
}
