import type { TokopediaShop } from "../../types";

function parseCountString(str: string): number {
  if (!str) return 0;
  const s = str.trim();

  const rbMatch = s.match(/([\d,.]+)\s*rb\+?/i);
  if (rbMatch) {
    const num = parseFloat(rbMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }

  const jtMatch = s.match(/([\d,.]+)\s*jt\+?/i);
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  // K/M (less common but handle)
  const kMatch = s.match(/([\d,.]+)\s*K\b/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(",", ".")) * 1_000);

  const mMatch = s.match(/([\d,.]+)\s*M\b/i);
  if (mMatch) return Math.round(parseFloat(mMatch[1].replace(",", ".")) * 1_000_000);

  const plain = parseInt(s.replace(/\./g, "").replace(/[^\d]/g, ""), 10);
  return isNaN(plain) ? 0 : plain;
}

export function scrapeTokopediaShop(): TokopediaShop | null {
  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const username = segments[0];

  if (!username) {
    console.log("[Tokopedia Shop] No username in pathname:", pathname);
    return null;
  }

  // Name: prefer DOM element, fallback to page title
  const nameEl =
    document.querySelector('[data-testid="shopNameHeader"]') ||
    document.querySelector('[data-testid="shopName"]') ||
    document.querySelector('h1[class*="shopName"]');
  const shopName =
    nameEl?.textContent?.trim() ||
    document.title.split("|")[0].trim() ||
    username;

  const bodyText = document.body.innerText;

  // Follower count — "X rb Pengikut" or "X Pengikut"
  const followerMatch = bodyText.match(/([\d,.]+(?:\s*(?:rb|jt|K|M))?)\s{0,5}(?:Pengikut|Followers)/i);
  const follower_count = followerMatch ? parseCountString(followerMatch[1]) : undefined;

  // Rating — "4.8 dari 5" or "Rating Toko X"
  const ratingMatch = bodyText.match(/(\d+(?:[.,]\d+)?)\s{0,5}(?:dari\s*5|\/\s*5)/i) ||
    bodyText.match(/Rating\s{0,5}Toko\s{0,5}(\d+(?:[.,]\d+)?)/i);
  const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(",", ".")) : undefined;

  // Product count — "X Produk" (use \s{0,5} to avoid greedy cross-line match)
  const productMatch = bodyText.match(/([\d,.]+(?:\s*(?:rb|jt|K|M))?)\s{0,5}Produk\b/i);
  const total_products = productMatch ? parseCountString(productMatch[1]) : undefined;

  // Location — "Dikirim dari X" or city badges near shop header
  const locationMatch = bodyText.match(/(?:Dikirim dari|Lokasi)\s{0,5}([A-Za-z\s]+?)(?:\n|\r|$)/i);
  const location = locationMatch ? locationMatch[1].trim() : undefined;

  // Official store badge
  const is_official =
    document.querySelector('[data-testid="shopBadgeOS"]') !== null ||
    /Official Store/i.test(bodyText);

  console.log("[Tokopedia Shop] username:", username, "| name:", shopName,
    "| followers:", follower_count, "| products:", total_products,
    "| rating:", rating, "| official:", is_official);

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
