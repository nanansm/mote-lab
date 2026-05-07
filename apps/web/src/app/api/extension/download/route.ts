import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

const ZIP_PATH = join(process.cwd(), "public", "mote-lab-extension.zip");
const VERSION = "1.0.0";

export async function GET(request: NextRequest) {
  const zipExists = existsSync(ZIP_PATH);

  if (request.nextUrl.searchParams.get("download") === "1") {
    if (!zipExists) {
      return NextResponse.json(
        { error: "Extension ZIP not yet available." },
        { status: 503 },
      );
    }
    const buf = await readFile(ZIP_PATH);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="mote-lab-extension.zip"',
        "Content-Length": String(buf.length),
      },
    });
  }

  return NextResponse.json({
    version: VERSION,
    available: zipExists,
    downloadUrl: "/api/extension/download?download=1",
  });
}
