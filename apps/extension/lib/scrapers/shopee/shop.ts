import type { ShopeeShop } from "../../types";

// Strict parse: only handle the formats that actually appear in Shopee shop stat labels.
// "44,4RB" → 44400 | "75,8RB" → 75800 | "1,7JT" → 1700000
// "147" → 147 | "1.700" → 1700 (dot = thousands separator in Indonesian)
function parseCountString(str: string): number {
  if (!str) return 0;
  const clean = str.trim();

  const rbMatch = clean.match(/^([\d,.]+)\s*RB$/i);
  if (rbMatch) {
    const num = parseFloat(rbMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }

  const jtMatch = clean.match(/^([\d,.]+)\s*JT$/i);
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  // Plain number — dots are thousands separators (1.700 = 1700)
  const plain = parseInt(clean.replace(/\./g, "").replace(/[^\d]/g, ""), 10);
  return isNaN(plain) ? 0 : plain;
}

// Extract the value after an explicit "Label: <value>" pattern in bodyText.
// This prevents random numbers elsewhere on the page (e.g. promo prices) from
// being matched — Shopee shop stat rows always use this colon-separated format.
function extractLabeled(bodyText: string, label: string): string {
  const pattern = new RegExp(`${label}:\\s*([^\\n]+)`, "i");
  return bodyText.match(pattern)?.[1]?.trim() ?? "";
}

export function scrapeShopeeShop(): ShopeeShop | null {
  // Primary: __NEXT_DATA__ — has numeric shopid and clean structured data
  try {
    const el = document.getElementById("__NEXT_DATA__");
    if (el?.textContent) {
      const json = JSON.parse(el.textContent);
      const shop =
        json?.props?.pageProps?.initialData?.result?.shop_info ??
        json?.props?.pageProps?.shopInfo;
      if (shop?.shopid) {
        console.log("[Shopee Shop] Found via __NEXT_DATA__, shopid:", shop.shopid);
        return {
          external_id: `${shop.shopid}`,
          name: shop.name ?? "",
          username: shop.account?.username,
          url: window.location.href,
          follower_count: shop.follower_count,
          rating: shop.rating_star,
          total_products: shop.item_count,
          joined_date: shop.ctime ? new Date(shop.ctime * 1000).toISOString() : undefined,
          location: shop.shop_location,
          is_official: shop.is_official_shop ?? false,
        };
      }
    }
  } catch {
    // fall through to DOM
  }

  // DOM fallback: label-based extraction from body text
  const pathname = window.location.pathname;
  const username = pathname.replace(/^\//, "").split(/[#?]/)[0];
  if (!username) {
    console.log("[Shopee Shop] No username in pathname:", pathname);
    return null;
  }

  // Prefer numeric shopId so products.shopId (from -i.{shopId}.{productId} URLs) matches
  // shops.externalId on the dashboard join. Fall back to username when no product links exist.
  const productLink = document.querySelector<HTMLAnchorElement>('a[href*="-i."]');
  const numericShopId = productLink?.href?.match(/-i\.(\d+)\./)?.[1];
  const external_id = numericShopId ?? username;

  const shopName =
    document.title.split("|")[0].replace(/^Toko Online\s*/i, "").trim() ||
    username;

  const bodyText = document.body.innerText;

  // Shopee shop info rows use explicit "Label: value" format, e.g.
  // "Produk: 475", "Pengikut: 75,8RB", "Penilaian: 4.9 (15,8RB Penilaian)"
  const produkRaw = extractLabeled(bodyText, "Produk");
  const pengikutRaw = extractLabeled(bodyText, "Pengikut");
  const penilaianRaw = extractLabeled(bodyText, "Penilaian");

  const total_products = parseCountString(produkRaw);
  const follower_count = parseCountString(pengikutRaw);

  // Rating is the leading decimal before the parenthetical: "4.9 (15,8RB Penilaian)" → 4.9
  const ratingMatch = penilaianRaw.match(/^(\d+\.\d+)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

  const is_official =
    (/shopee mall/i.test(bodyText) ||
      document.querySelector('img[alt*="Mall"], img[alt*="mall"]') !== null ||
      document.querySelector('[class*="mall"]') !== null);

  console.log("[Shopee Shop] Raw labels:", { produk: produkRaw, pengikut: pengikutRaw, penilaian: penilaianRaw });
  console.log("[Shopee Shop] Parsed:", { external_id, username, name: shopName, follower_count, total_products, rating, is_official });

  return {
    external_id,
    name: shopName,
    username,
    url: `https://shopee.co.id/${username}`,
    follower_count,
    rating,
    total_products,
    is_official,
  };
}
