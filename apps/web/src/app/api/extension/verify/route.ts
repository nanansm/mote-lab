import { NextRequest, NextResponse } from "next/server";
import { validateExtensionToken, getQuotaState } from "@/lib/extension-auth";
import { withCors, handleOptions } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request) ?? new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  const authHeader = request.headers.get("authorization");
  const raw = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!raw) {
    return withCors(NextResponse.json({ valid: false, error: "Missing token" }, { status: 401 }), request);
  }

  const tokenUser = await validateExtensionToken(raw);
  if (!tokenUser) {
    return withCors(NextResponse.json({ valid: false, error: "Invalid or expired token" }, { status: 401 }), request);
  }

  const quota = await getQuotaState(tokenUser.userId, tokenUser.plan);

  return withCors(
    NextResponse.json({
      valid: true,
      user: {
        id: tokenUser.userId,
        email: tokenUser.email,
        name: tokenUser.name,
        plan: tokenUser.plan,
      },
      quota,
    }),
    request,
  );
}
