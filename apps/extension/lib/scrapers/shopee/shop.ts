import type { ShopeeShop } from "../../types";

function parseCountString(str: string): number {
  if (!str) return 0;
  const s = str.trim();
  if (/RB/i.test(s)) return Math.round(parseFloat(s.replace(/[^\d,.]/g, "").replace(",", ".")) * 1_000);
  if (/JT/i.test(s)) return Math.round(parseFloat(s.replace(/[^\d,.]/g, "").replace(",", ".")) * 1_000_000);
  if (/K/i.test(s)) return Math.round(parseFloat(s.replace(/[^\d,.]/g, "").replace(",", ".")) * 1_000);
  if (/M/i.test(s)) return Math.round(parseFloat(s.replace(/[^\d,.]/g, "").replace(",", ".")) * 1_000_000);
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

export function scrapeShopeeShop(): ShopeeShop | null {
  // Primary: __NEXT_DATA__ (has numeric shopid, ideal for linking with products)
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
    // fall through
  }

  // DOM fallback: extract from URL + body text (handles /{shopname} pattern)
  const pathname = window.location.pathname;
  const username = pathname.replace(/^\//, "").split(/[#?]/)[0];
  if (!username) {
    console.log("[Shopee Shop] No username found in URL pathname:", pathname);
    return null;
  }

  const shopName =
    document.title.split("|")[0].replace(/^Toko Online\s*/i, "").trim() ||
    username;

  const bodyText = document.body.innerText;

  const followerMatch = bodyText.match(/([\d.,]+(?:RB|JT|K|M)?)\s*(?:Pengikut|Followers)/i);
  const follower_count = followerMatch ? parseCountString(followerMatch[1]) : 0;

  const ratingMatch = bodyText.match(/(\d\.\d)\s*(?:\/\s*5\.?0?)?\s*(?:Penilaian|Rating)/i);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

  const productMatch = bodyText.match(/([\d.,]+(?:RB|JT|K|M)?)\s*Produk/i);
  const total_products = productMatch ? parseCountString(productMatch[1]) : 0;

  const is_official =
    /shopee mall/i.test(bodyText) ||
    document.querySelector('[alt*="Mall"], [alt*="mall"]') !== null;

  console.log("[Shopee Shop] DOM fallback — username:", username, "| name:", shopName,
    "| followers:", follower_count, "| rating:", rating, "| products:", total_products);

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
