#!/usr/bin/env node
/**
 * Build + package the Chrome extension and copy the ZIP to apps/web/public/
 * so it's served at /mote-lab-extension.zip
 *
 * Usage: node scripts/package-extension.mjs
 */
import { execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { copyFile } from "fs/promises";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const EXT_DIR = join(ROOT, "apps", "extension");
const PUBLIC_DIR = join(ROOT, "apps", "web", "public");

console.log("📦 Building extension...");
execSync("npm run build", { cwd: EXT_DIR, stdio: "inherit" });

// Plasmo outputs zip to build/chrome-mv3-prod.zip or similar
const buildDir = join(EXT_DIR, "build");
const files = readdirSync(buildDir).filter((f) => f.endsWith(".zip"));
if (files.length === 0) {
  console.error("❌ No .zip found in apps/extension/build/");
  process.exit(1);
}

const zipSrc = join(buildDir, files[0]);

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

const zipDst = join(PUBLIC_DIR, "mote-lab-extension.zip");
await copyFile(zipSrc, zipDst);

console.log(`✅ Extension packaged → apps/web/public/mote-lab-extension.zip`);
