import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tokenId: string | undefined;
  try {
    const body = await request.json();
    tokenId = body?.tokenId;
  } catch {
    // Revoke all if no specific ID
  }

  if (tokenId) {
    await db
      .delete(schema.extensionTokens)
      .where(
        and(
          eq(schema.extensionTokens.id, tokenId),
          eq(schema.extensionTokens.userId, session.user.id),
        ),
      );
  } else {
    await db
      .delete(schema.extensionTokens)
      .where(eq(schema.extensionTokens.userId, session.user.id));
  }

  return NextResponse.json({ ok: true });
}
