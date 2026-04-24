import type { TokopediaShop } from "../../types";

// "436,6 rb" → 436600 | "4 jt" → 4000000 | "1.234" → 1234
function parseCountString(str: string): number {
  if (!str) return 0;
  const clean = str.trim();

  if (/jt/i.test(clean)) {
    const num = parseFloat(clean.replace(/[^\d,]/g, "").replace(",", "."));
    return Math.round(num * 1_000_000);
  }
  if (/rb/i.test(clean)) {
    const num = parseFloat(clean.replace(/[^\d,]/g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }
  if (/k/i.test(clean)) {
    const num = parseFloat(clean.replace(/[^\d,]/g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }

  // Plain number with dot as thousands separator
  return parseInt(clean.replace(/\./g, "").replace(/[^\d]/g, ""), 10) || 0;
}

export function scrapeTokopediaShop(): TokopediaShop | null {
  const username = window.location.pathname.split("/").filter(Boolean)[0];
  if (!username) {
    console.log("[Tokopedia Shop] No username in pathname");
    return null;
  }

  // Shop name from h1
  const shopName = document.querySelector("h1")?.textContent?.trim() || username;

  const bodyText = document.body.innerText;

  // Header stat format: "4.9 (436,6 rb) • 4 jt terjual"
  // or: "4.9 (1,2 rb) • 500 terjual"
  const headerMatch = bodyText.match(
    /(\d+\.\d+)\s*\(([\d,.\s]+(?:rb|jt|k|m)?)\s*\)\s*[•·]\s*([\d,.\s]+(?:rb|jt|k|m)?)\s*terjual/i,
  );

  let rating: number | undefined;
  let review_count = 0;
  let total_sold = 0;

  if (headerMatch) {
    rating = parseFloat(headerMatch[1]);
    review_count = parseCountString(headerMatch[2]);
    total_sold = parseCountString(headerMatch[3]);
  } else {
    // Fallback: find rating standalone "X.Y" near start of body
    const ratingMatch = bodyText.match(/(?:^|\n)\s*(\d\.\d)\s*(?:\n|$)/m);
    if (ratingMatch) rating = parseFloat(ratingMatch[1]);
  }

  // Location: "Kab." or "Kota" prefix near shop info section
  const lokasiMatch = bodyText.match(/(Kab\.|Kota)\s+[A-Z][a-zA-Z\s]+/);
  const location = lokasiMatch ? lokasiMatch[0].trim() : undefined;

  const is_official =
    /Power Merchant Pro/i.test(bodyText) ||
    /Official Store/i.test(bodyText) ||
    document.querySelector('[data-testid="shopBadgeOS"]') !== null;

  console.log("[Tokopedia Shop] Parsed:", {
    username, name: shopName, rating, review_count, total_sold, location, is_official,
  });

  return {
    external_id: username,
    name: shopName,
    username,
    url: `https://www.tokopedia.com/${username}`,
    rating: rating && !isNaN(rating) ? rating : undefined,
    review_count,
    total_sold,
    is_official,
    location,
  };
}
