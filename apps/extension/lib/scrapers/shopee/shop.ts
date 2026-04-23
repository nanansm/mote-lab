import type { ShopeeShop } from "../../types";

function parseCountString(str: string): number {
  if (!str) return 0;
  const s = str.trim();

  // Handle "X,YRB" / "X,YJT" — comma as decimal separator (Indonesian format)
  const rbMatch = s.match(/([\d,.]+)\s*RB/i);
  if (rbMatch) {
    const num = parseFloat(rbMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }

  const jtMatch = s.match(/([\d,.]+)\s*JT/i);
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  // K/M suffix (less common in Shopee but handle anyway)
  const kMatch = s.match(/([\d,.]+)\s*K\b/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000);
  }

  const mMatch = s.match(/([\d,.]+)\s*M\b/i);
  if (mMatch) {
    const num = parseFloat(mMatch[1].replace(/\./g, "").replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  // Plain number — dots are thousands separators in Indonesian (1.700 = 1700)
  const num = parseInt(s.replace(/\./g, "").replace(/[^\d]/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

export function scrapeShopeeShop(): ShopeeShop | null {
  // Primary: __NEXT_DATA__ (has numeric shopid, ideal for product linking)
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

  // DOM fallback: URL username + body text parsing
  const pathname = window.location.pathname;
  const username = pathname.replace(/^\//, "").split(/[#?]/)[0];
  if (!username) {
    console.log("[Shopee Shop] No username in pathname:", pathname);
    return null;
  }

  const shopName =
    document.title.split("|")[0].replace(/^Toko Online\s*/i, "").trim() ||
    username;

  const bodyText = document.body.innerText;

  // Use \s{0,5} instead of \s* to prevent greedy cross-line matching
  // (avoids matching product prices far from the label keyword)
  const followerMatch = bodyText.match(/([\d.,]+(?:RB|JT|K|M)?)\s{0,5}(?:Pengikut|Followers)/i);
  const follower_count = followerMatch ? parseCountString(followerMatch[1]) : 0;

  const ratingMatch = bodyText.match(/(\d\.\d)\s{0,5}(?:\/\s*5\.?0?)?\s{0,5}(?:Penilaian|Rating)/i);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

  const productMatch = bodyText.match(/([\d.,]+(?:RB|JT|K|M)?)\s{0,5}Produk\b/i);
  const total_products = productMatch ? parseCountString(productMatch[1]) : 0;

  const is_official =
    /shopee mall/i.test(bodyText) ||
    document.querySelector('[alt*="Mall"], [alt*="mall"]') !== null;

  console.log("[Shopee Shop] DOM fallback — username:", username,
    "| followers raw:", followerMatch?.[1], "→", follower_count,
    "| products raw:", productMatch?.[1], "→", total_products,
    "| rating:", rating);

  return {
    external_id: username,
    name: shopName,
    username,
    url: `https://shopee.co.id/${username}`,
    follower_count,
    rating,
    total_products,
    is_official,
  };
}
