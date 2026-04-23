import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { getRedis } from "@/lib/redis";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

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

  // Honeypot filled → silent reject (looks like success to confuse bots)
  if (website) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerHash = process.env.OWNER_PASSWORD_HASH;

  if (!ownerEmail || !ownerHash || !email || !password) {
    await delay();
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const emailMatch = email === ownerEmail;
  // First layer: verify against OWNER_PASSWORD_HASH env var (bcrypt)
  const passwordMatch = emailMatch ? await bcrypt.compare(password, ownerHash) : false;

  if (!emailMatch || !passwordMatch) {
    await redis.multi().incr(key).expire(key, WINDOW_SECONDS).exec();
    await delay();
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Credentials valid — second layer: sign in via better-auth to get a real session cookie
  try {
    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    if (!signInResponse.ok) {
      await delay();
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await redis.del(key);

    const response = NextResponse.json({ success: true });
    signInResponse.headers.forEach((value, name) => {
      if (name.toLowerCase() === "set-cookie") {
        response.headers.append("set-cookie", value);
      }
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
