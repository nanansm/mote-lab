import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { join } from "path";

const ZIP_PATH = join(process.cwd(), "public", "mote-lab-extension.zip");
const VERSION = "1.0.0";

export async function GET(request: NextRequest) {
  // Return download info. Actual file download is handled by /public static serving.
  const zipExists = existsSync(ZIP_PATH);

  if (request.nextUrl.searchParams.get("download") === "1") {
    if (!zipExists) {
      return NextResponse.json(
        { error: "Extension ZIP not yet available. Build the extension first." },
        { status: 503 },
      );
    }
    // Redirect to the static file so Next.js can stream it efficiently
    return NextResponse.redirect(new URL("/mote-lab-extension.zip", request.url));
  }

  return NextResponse.json({
    version: VERSION,
    available: zipExists,
    downloadUrl: "/api/extension/download?download=1",
    instructions: "Load unpacked dari folder chrome-mv3-prod/ untuk developer mode",
  });
}
