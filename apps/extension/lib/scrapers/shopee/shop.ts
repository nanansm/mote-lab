import type { ShopeeShop } from "../../types";

export function scrapeShopeeShop(): ShopeeShop | null {
  try {
    const el = document.getElementById("__NEXT_DATA__");
    if (el?.textContent) {
      const json = JSON.parse(el.textContent);
      const shop = json?.props?.pageProps?.initialData?.result?.shop_info ?? json?.props?.pageProps?.shopInfo;
      if (shop?.shopid) {
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

  // DOM fallback
  const url = window.location.href;
  const shopIdMatch = url.match(/\/shop\/(\d+)/);
  if (!shopIdMatch) return null;

  const name =
    document.querySelector<HTMLElement>('[class*="shop-info"] [class*="shop-name"]')?.textContent?.trim() ?? "";
  if (!name) return null;

  return {
    external_id: shopIdMatch[1],
    name,
    url,
  };
}
