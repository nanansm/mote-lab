import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq, count } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, activeSubs] = await Promise.all([
    db.select({ count: count() }).from(schema.users),
    db
      .select({ count: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, "active")),
  ]);

  return NextResponse.json({
    totalUsers: totalUsers[0]?.count ?? 0,
    activeSubscriptions: activeSubs[0]?.count ?? 0,
  });
}
