import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@mote-lab/db";
import { getRedis } from "@/lib/redis";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function rateKey(ip: string) {
  return `owner_login:${ip}`;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function delay() {
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
}

// Generates a random alphanumeric token matching better-auth's generateId format
function generateToken(size = 32): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(size);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// Replicates better-auth's makeSignature: HMAC-SHA256 → base64
function signToken(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64");
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const redis = getRedis();
  const key = rateKey(ip);

  const rawAttempts = await redis.get(key);
  if (rawAttempts && parseInt(rawAttempts) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { email, password, website } = body;

  // Honeypot filled → silent accept (looks like success to confuse bots)
  if (website) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;
  const secret = process.env.BETTER_AUTH_SECRET;

  console.log("[owner-login] attempt for:", email);
  const emailMatch = !!ownerEmail && email === ownerEmail;
  // Plain-text comparison — no hashing, change OWNER_PASSWORD env to rotate
  const passwordMatch = !!ownerPassword && password === ownerPassword;
  console.log("[owner-login] env_email_match:", emailMatch);
  console.log("[owner-login] env_password_match:", passwordMatch);

  if (!emailMatch || !passwordMatch || !secret) {
    await redis.multi().incr(key).expire(key, WINDOW_SECONDS).exec();
    await delay();
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Confirm user exists with owner role
  const ownerUser = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (!ownerUser || (ownerUser as { role?: string }).role !== "owner") {
    console.log("[owner-login] user not found or not owner");
    await delay();
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Create a better-auth compatible session manually
  try {
    const sessionToken = generateToken(32);
    const sessionId = generateToken(32);
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

    await db.insert(schema.sessions).values({
      id: sessionId,
      token: sessionToken,
      userId: ownerUser.id,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? "",
    });

    // Cookie value format: "{token}.{HMAC-SHA256(token, secret)}"
    // This matches better-auth's setSignedCookie / makeSignature exactly
    const signature = signToken(sessionToken, secret);
    const cookieValue = `${sessionToken}.${signature}`;

    await redis.del(key);

    console.log("[owner-login] session created for:", ownerUser.id);

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "better-auth.session_token",
      value: cookieValue,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch (err) {
    console.error("[owner-login] session creation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
