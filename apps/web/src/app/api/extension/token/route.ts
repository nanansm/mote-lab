import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { generateRawToken, hashToken } from "@/lib/extension-auth";
import { withCors, handleOptions } from "@/lib/cors";

const TOKEN_TTL_DAYS = 30;

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request) ?? new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  try {
    // Revoke any existing active tokens for this user
    await db
      .delete(schema.extensionTokens)
      .where(eq(schema.extensionTokens.userId, session.user.id));

    const raw = generateRawToken();
    const hashed = hashToken(raw);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(schema.extensionTokens).values({
      id: randomUUID(),
      userId: session.user.id,
      token: hashed,
      expiresAt,
      createdAt: new Date(),
    });

    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(schema.subscriptions.userId, session.user.id),
        eq(schema.subscriptions.status, "active"),
      ),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    const response = NextResponse.json({
      token: raw,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        plan: subscription?.plan ?? "trial",
      },
    });
    return withCors(response, request);
  } catch (err) {
    console.error("[extension/token] error:", err);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      request,
    );
  }
}
