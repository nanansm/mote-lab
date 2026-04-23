import type { TokopediaProduct } from "../../types";

function parseSoldCount(str: string): number {
  if (!str) return 0;
  const s = str.trim();

  // "Terjual X" prefix — strip it
  const cleaned = s.replace(/^Terjual\s*/i, "").trim();

  const rbMatch = cleaned.match(/([\d,.]+)\s*rb\+?/i);
  if (rbMatch) {
    const num = parseFloat(rbMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }

  const jtMatch = cleaned.match(/([\d,.]+)\s*jt\+?/i);
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  const plain = parseInt(cleaned.replace(/\./g, "").replace(/[^\d]/g, ""), 10);
  return isNaN(plain) ? 0 : plain;
}

function parsePrice(str: string): number {
  if (!str) return 0;
  // "Rp1.234.567" or "Rp 1.234.567"
  const cleaned = str.replace(/[Rp\s.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

function extractExternalId(url: string, shopUsername: string): string {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    // tokopedia.com/{shop}/{product-slug}
    if (segments.length >= 2) return `${segments[0]}__${segments[1]}`;
    if (segments.length === 1) return `${shopUsername}__${segments[0]}`;
  } catch {
    // ignore
  }
  return url;
}

function scrapeProductCard(el: Element): TokopediaProduct | null {
  // Name
  const nameEl =
    el.querySelector('[data-testid="spnSRPProdName"]') ||
    el.querySelector('[class*="prd_link-product-name"]') ||
    el.querySelector('span[class*="name"]');
  const name = nameEl?.textContent?.trim() ?? "";
  if (!name) return null;

  // URL
  const linkEl =
    el.querySelector('[data-testid="lnkProductContainer"]') ||
    el.querySelector('a[href*="tokopedia.com"]') ||
    el.closest("a");
  const rawUrl = linkEl instanceof HTMLAnchorElement ? linkEl.href : (linkEl?.getAttribute("href") ?? "");
  if (!rawUrl) return null;

  // Price
  const priceEl =
    el.querySelector('[data-testid="spnSRPProdPrice"]') ||
    el.querySelector('[class*="prd_link-product-price"]') ||
    el.querySelector('span[class*="price"]');
  const current_price = parsePrice(priceEl?.textContent ?? "");

  // Sold count
  const soldEl =
    el.querySelector('[data-testid="spnSRPProdLabel"]') ||
    el.querySelector('[class*="prd_label-integrity"]') ||
    el.querySelector('span[class*="sold"]');
  const total_sold = parseSoldCount(soldEl?.textContent ?? "");

  // Rating
  const ratingEl =
    el.querySelector('[data-testid="spnSRPProdRating"]') ||
    el.querySelector('[class*="prd_rating-average-text"]');
  const ratingText = ratingEl?.textContent?.trim() ?? "";
  const rating = ratingText ? parseFloat(ratingText) : undefined;

  // Shop name / location
  const shopLocEl = el.querySelector('[data-testid="spnSRPProdTabShopLoc"]');
  const shopLocText = shopLocEl?.textContent?.trim() ?? "";
  // Format can be "ShopName · Location" or just location
  const shopLocParts = shopLocText.split("·").map((p) => p.trim());
  const shop_name = shopLocParts.length > 1 ? shopLocParts[0] : undefined;
  const location = shopLocParts.length > 1 ? shopLocParts[1] : shopLocParts[0] || undefined;

  // External ID from URL
  const url = rawUrl.split("?")[0];
  const shopUsername = shop_name?.toLowerCase().replace(/\s+/g, "-") ?? "";
  const external_id = extractExternalId(url, shopUsername);

  return {
    external_id,
    name,
    url,
    current_price,
    total_sold,
    rating: rating && !isNaN(rating) ? rating : undefined,
    shop_name,
    location,
  };
}

export function scrapeTokopediaProductList(): TokopediaProduct[] {
  const results: TokopediaProduct[] = [];
  const seen = new Set<string>();

  // Try primary selector: divProductWrapper
  let containers = Array.from(document.querySelectorAll('[data-testid="divProductWrapper"]'));

  // Fallback: lnkProductContainer parent
  if (containers.length === 0) {
    const links = document.querySelectorAll('[data-testid="lnkProductContainer"]');
    containers = Array.from(links).map((l) => l.closest("div") ?? l) as Element[];
  }

  // Fallback: generic product grid items
  if (containers.length === 0) {
    containers = Array.from(document.querySelectorAll('div[class*="css-"][data-theme="default"] > a'));
  }

  console.log("[Tokopedia Scraper] Found", containers.length, "product containers");

  for (const el of containers) {
    const product = scrapeProductCard(el);
    if (!product || seen.has(product.external_id)) continue;
    seen.add(product.external_id);
    results.push(product);
  }

  // If still empty, try scraping from JSON-LD or window.__cache__
  if (results.length === 0) {
    try {
      const jsonLdEls = document.querySelectorAll('script[type="application/ld+json"]');
      for (const el of jsonLdEls) {
        const data = JSON.parse(el.textContent ?? "{}");
        if (data["@type"] === "ItemList" && Array.isArray(data.itemListElement)) {
          for (const item of data.itemListElement) {
            const product = item.item ?? item;
            if (!product.name || !product.url) continue;
            const id = product.productID ?? product.sku ?? product.url;
            if (seen.has(id)) continue;
            seen.add(id);
            results.push({
              external_id: id,
              name: product.name,
              url: product.url,
              current_price: product.offers?.price ?? 0,
              total_sold: 0,
              rating: product.aggregateRating?.ratingValue,
            });
          }
        }
      }
    } catch {
      // ignore JSON-LD parse errors
    }
  }

  console.log("[Tokopedia Scraper] Scraped", results.length, "products");
  return results;
}
