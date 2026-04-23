import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db, schema } from "@mote-lab/db";
import { validateExtensionToken, checkAndIncrementQuota } from "@/lib/extension-auth";
import { getRedis } from "@/lib/redis";
import { withCors, handleOptions } from "@/lib/cors";
import { processQueueItems } from "@/lib/ingest-processor";

const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX = 60; // requests per minute per user

async function rateLimit(userId: string): Promise<boolean> {
  const redis = getRedis();
  const key = `ingest_rate:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, RATE_LIMIT_WINDOW);
  return count <= RATE_LIMIT_MAX;
}

type IngestHandlerOptions = {
  marketplace: "shopee" | "tiktok";
  dataType: "products" | "shop";
  schema: z.ZodTypeAny;
  quotaIncrement: (body: unknown) => number;
};

export function createIngestHandler(opts: IngestHandlerOptions) {
  return async function handler(request: NextRequest): Promise<NextResponse> {
    if (request.method === "OPTIONS") {
      return handleOptions(request) ?? new NextResponse(null, { status: 204 });
    }

    const authHeader = request.headers.get("authorization");
    const raw = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!raw) {
      return withCors(NextResponse.json({ ok: false, error: "Missing token" }, { status: 401 }), request);
    }

    const tokenUser = await validateExtensionToken(raw);
    if (!tokenUser) {
      return withCors(NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 401 }), request);
    }

    // Rate limit
    const allowed = await rateLimit(tokenUser.userId);
    if (!allowed) {
      return withCors(
        NextResponse.json({ ok: false, error: "Rate limit exceeded. Max 60 req/min." }, { status: 429 }),
        request,
      );
    }

    // Parse body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return withCors(NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }), request);
    }

    // Validate
    const parsed = opts.schema.safeParse(body);
    if (!parsed.success) {
      return withCors(
        NextResponse.json({ ok: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 422 }),
        request,
      );
    }

    const itemCount = opts.quotaIncrement(parsed.data);

    // Quota check + increment
    const quota = await checkAndIncrementQuota(tokenUser.userId, tokenUser.plan, itemCount);
    if (!quota.allowed) {
      return withCors(
        NextResponse.json({
          ok: false,
          error: "Daily quota exceeded",
          quota: { used: quota.used, limit: quota.limit, resetAt: quota.resetAt },
        }, { status: 429 }),
        request,
      );
    }

    // Insert to ingest_queue
    const queueId = randomUUID();
    await db.insert(schema.ingestQueue).values({
      id: queueId,
      userId: tokenUser.userId,
      marketplace: opts.marketplace,
      dataType: opts.dataType,
      rawData: parsed.data as Record<string, unknown>,
      status: "pending",
      createdAt: new Date(),
    });

    // Background processing
    after(async () => {
      try {
        await processQueueItems([queueId]);
      } catch (err) {
        console.error(`[ingest/${opts.marketplace}/${opts.dataType}] processing error:`, err);
      }
    });

    return withCors(
      NextResponse.json({
        ok: true,
        queued: itemCount,
        quotaRemaining: quota.remaining,
      }),
      request,
    );
  };
}
