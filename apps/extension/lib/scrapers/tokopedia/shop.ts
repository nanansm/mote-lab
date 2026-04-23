import type { TokopediaShop } from "../../types";

function parseCountString(str: string): number {
  if (!str) return 0;
  const clean = str.trim();

  // "5,6rb" / "44,4RB" → thousands
  const rbMatch = clean.match(/^([\d,.]+)\s*rb\+?$/i);
  if (rbMatch) {
    const num = parseFloat(rbMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }

  // "1,2jt" / "1,7JT" → millions
  const jtMatch = clean.match(/^([\d,.]+)\s*jt\+?$/i);
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  const plain = parseInt(clean.replace(/\./g, "").replace(/[^\d]/g, ""), 10);
  return isNaN(plain) ? 0 : plain;
}

function extractLabeled(bodyText: string, ...labels: string[]): string {
  for (const label of labels) {
    const pattern = new RegExp(`${label}:\\s*([^\\n]+)`, "i");
    const value = bodyText.match(pattern)?.[1]?.trim();
    if (value) return value;
  }
  return "";
}

export function scrapeTokopediaShop(): TokopediaShop | null {
  const pathname = window.location.pathname;
  const username = pathname.split("/").filter(Boolean)[0];
  if (!username) {
    console.log("[Tokopedia Shop] No username in pathname:", pathname);
    return null;
  }

  const nameEl =
    document.querySelector('[data-testid="shopNameHeader"]') ||
    document.querySelector('[data-testid="shopName"]');
  const shopName =
    nameEl?.textContent?.trim() ||
    document.title.split("|")[0].trim() ||
    username;

  const bodyText = document.body.innerText;

  // Tokopedia shop stat rows use the same "Label: value" format as Shopee
  const produkRaw = extractLabeled(bodyText, "Produk", "Products");
  const pengikutRaw = extractLabeled(bodyText, "Pengikut", "Followers");
  const penilaianRaw = extractLabeled(bodyText, "Penilaian", "Rating");

  const total_products = parseCountString(produkRaw);
  const follower_count = parseCountString(pengikutRaw);

  const ratingMatch = penilaianRaw.match(/^(\d+[.,]\d+)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(",", ".")) : undefined;

  // Location: "Dikirim dari Jakarta" or city listed near shop header
  const locationMatch = bodyText.match(/(?:Dikirim dari|Lokasi)\s*:\s*([^\n]+)/i);
  const location = locationMatch?.[1]?.trim();

  const is_official =
    document.querySelector('[data-testid="shopBadgeOS"]') !== null ||
    /Official Store/i.test(bodyText);

  console.log("[Tokopedia Shop] Raw labels:", { produk: produkRaw, pengikut: pengikutRaw, penilaian: penilaianRaw });
  console.log("[Tokopedia Shop] Parsed:", { username, name: shopName, follower_count, total_products, rating, is_official });

  return {
    external_id: username,
    name: shopName,
    username,
    url: `https://www.tokopedia.com/${username}`,
    follower_count,
    rating: rating && !isNaN(rating) ? rating : undefined,
    total_products,
    location,
    is_official,
  };
}
