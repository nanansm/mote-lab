import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  /^chrome-extension:\/\//,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https:\/\/lab\.motekreatif\.com$/,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((pattern) => pattern.test(origin));
}

export function withCors(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  if (isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
  } else {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function handleOptions(request: NextRequest): NextResponse | null {
  if (request.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    return withCors(res, request);
  }
  return null;
}
