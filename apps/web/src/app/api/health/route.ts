import { NextResponse } from "next/server";
import { db } from "@mote-lab/db";
import { sql } from "drizzle-orm";
import { checkRedis } from "@/lib/redis";
import { logger } from "@/lib/logger";

export async function GET() {
  const start = Date.now();

  let dbStatus: "connected" | "error" = "error";
  let redisStatus: "connected" | "error" = "error";

  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (err) {
    logger.error({ err }, "Health check: DB error");
  }

  try {
    const ok = await checkRedis();
    redisStatus = ok ? "connected" : "error";
  } catch (err) {
    logger.error({ err }, "Health check: Redis error");
  }

  const status = dbStatus === "connected" && redisStatus === "connected" ? "ok" : "degraded";
  const latency = Date.now() - start;

  return NextResponse.json(
    {
      status,
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
      latency_ms: latency,
    },
    { status: status === "ok" ? 200 : 503 }
  );
}
