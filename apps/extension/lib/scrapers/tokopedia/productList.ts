import type { TokopediaProduct } from "../../types";
import { detectTokopediaPageType } from "./detect";

const BLOCKLIST = [
  "help", "about", "contact", "login", "register", "cart", "p",
  "category", "categories", "discovery", "play", "search", "find",
  "promo", "flash-sale", "tokopoints", "gold-merchant", "official-store",
];

// "100rb+ terjual" → 100000 | "4 jt terjual" → 4000000 | "500 terjual" → 500
function parseSoldCount(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/terjual/gi, "").replace(/\+/g, "").trim();

  if (/jt/i.test(cleaned)) {
    const num = parseFloat(cleaned.replace(/[^\d,]/g, "").replace(",", "."));
    return Math.round(num * 1_000_000);
  }
  if (/rb/i.test(cleaned)) {
    const num = parseFloat(cleaned.replace(/[^\d,]/g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }
  if (/k/i.test(cleaned)) {
    const num = parseFloat(cleaned.replace(/[^\d,]/g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }
  return parseInt(cleaned.replace(/[^\d]/g, ""), 10) || 0;
}

function parseCardText(card: HTMLElement, shopSlug: string, pageType: string): TokopediaProduct | null {
  const text = (card as HTMLElement).innerText ?? "";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // NAME: first line longer than 15 chars that isn't a price, discount, or noise
  const nameIdx = lines.findIndex(
    (l) =>
      l.length > 15 &&
      !l.startsWith("Rp") &&
      !/^\d+%$/.test(l) &&
      !/^-\d+%$/.test(l) &&
      !/terjual/i.test(l) &&
      !/hemat/i.test(l) &&
      !/cashback/i.test(l),
  );
  const name = nameIdx >= 0 ? lines[nameIdx] : "";
  if (!name) return null;

  // PRICE: lines matching "RpNNN.NNN"
  const priceLines = lines.filter((l) => /^Rp[\d.]+$/.test(l));
  const currentPrice = priceLines[0] ? parseInt(priceLines[0].replace(/[^\d]/g, ""), 10) : 0;
  const originalPrice = priceLines[1] ? parseInt(priceLines[1].replace(/[^\d]/g, ""), 10) : currentPrice;

  // RATING: "X.Y" standalone
  const ratingLine = lines.find((l) => /^\d\.\d$/.test(l));
  const rating = ratingLine ? parseFloat(ratingLine) : undefined;

  // SOLD: prefer a line where the NUMBER is directly adjacent to "terjual" on the same token
  // e.g. "100rb+ terjual" or "50 terjual" — avoid matching shop-level "4 jt terjual" headers
  // that bleed in when card walks up to a large container.
  const soldLine = lines.find((l) => /^[\d,.]+\s*(?:rb|jt|k|m)?\+?\s*terjual$/i.test(l)) ??
    lines.find((l) => /terjual/i.test(l)) ?? "";

  const rawSold = parseSoldCount(soldLine);
  // Sanity cap: no individual product realistically sells more than 10 million units
  const MAX_PRODUCT_SOLD = 10_000_000;
  const totalSold = Math.min(rawSold, MAX_PRODUCT_SOLD);
  if (rawSold > MAX_PRODUCT_SOLD) {
    console.warn("[Tokopedia Scraper] Clamped suspiciously high sold:", name, "|", soldLine, "→", rawSold, "(clamped to", MAX_PRODUCT_SOLD, ")");
  }

  // SHOP NAME: on shop page use h1; on search page it follows the sold line
  const soldIdx = lines.findIndex((l) => /terjual/i.test(l));
  const shopName =
    pageType === "shop"
      ? (document.querySelector("h1")?.textContent?.trim() || shopSlug)
      : (lines[soldIdx + 1] || shopSlug);

  // LOCATION: Indonesian city/region prefix
  const locationLine =
    lines.find((l) =>
      /^(Kab\.|Kota|Jakarta|Tangerang|Bandung|Surabaya|Medan|Semarang|Yogyakarta|Bali|Bekasi|Depok|Bogor|Luar Negeri)/i.test(l),
    ) ?? "";

  const img = card.querySelector<HTMLImageElement>("img");
  const imageUrl = img?.src || img?.srcset?.split(" ")[0] || "";

  return {
    external_id: "",  // filled by caller after URL parsing
    name,
    url: "",          // filled by caller
    current_price: currentPrice,
    original_price: originalPrice,
    total_sold: totalSold,
    rating,
    shop_id: shopSlug,
    shop_name: shopName || undefined,
    image_url: imageUrl || undefined,
    location: locationLine || undefined,
  };
}

export function scrapeTokopediaProductList(): TokopediaProduct[] {
  const pageType = detectTokopediaPageType();
  console.log("[Tokopedia Scraper] Page type:", pageType, "| URL:", window.location.href);

  if (pageType !== "search" && pageType !== "shop") return [];

  // Collect unique product links: href pattern /{shop_slug}/{product_slug}
  const allLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="tokopedia.com/"]'));
  const seenSlugs = new Set<string>();
  const productLinks: { link: HTMLAnchorElement; shopSlug: string; productSlug: string }[] = [];

  for (const a of allLinks) {
    try {
      const url = new URL(a.href);
      if (!url.hostname.includes("tokopedia.com")) continue;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length !== 2) continue;
      if (BLOCKLIST.includes(parts[0])) continue;

      const key = `${parts[0]}/${parts[1]}`;
      if (seenSlugs.has(key)) continue;
      seenSlugs.add(key);

      productLinks.push({ link: a, shopSlug: parts[0], productSlug: parts[1] });
    } catch {
      // invalid URL
    }
  }

  console.log("[Tokopedia Scraper] Unique product links found:", productLinks.length);

  const results: TokopediaProduct[] = [];

  for (let i = 0; i < productLinks.length; i++) {
    const { link, shopSlug, productSlug } = productLinks[i];
    try {
      // Walk up the DOM tree to find the card container that has price + sold/rating info
      let card: HTMLElement = link as HTMLElement;
      for (let depth = 0; depth < 8; depth++) {
        if (!card.parentElement) break;
        card = card.parentElement as HTMLElement;
        const text = card.innerText ?? "";
        if (text.includes("Rp") && (/terjual/i.test(text) || /\d\.\d/.test(text))) break;
      }

      const product = parseCardText(card, shopSlug, pageType);
      if (!product) continue;

      const cleanUrl = link.href.split("?")[0];
      product.external_id = `${shopSlug}__${productSlug}`;
      product.url = cleanUrl;

      results.push(product);
    } catch (err) {
      console.error("[Tokopedia Scraper] Error parsing item", i, err);
    }
  }

  console.log("[Tokopedia Scraper] Parsed", results.length, "products");
  return results;
}
