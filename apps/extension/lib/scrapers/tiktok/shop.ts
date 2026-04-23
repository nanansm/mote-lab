import type { TiktokShop } from "../../types";

export function scrapeTiktokShop(): TiktokShop | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = (window as any).__INITIAL_STATE__ ?? (window as any).SIGI_STATE;
    if (state) {
      const shop =
        state?.ShopModule?.shopInfo ??
        state?.UserModule?.users?.[Object.keys(state?.UserModule?.users ?? {})[0]];
      if (shop?.shopId ?? shop?.id) {
        const id = `${shop.shopId ?? shop.id}`;
        return {
          external_id: id,
          name: shop.name ?? shop.nickname ?? "",
          username: shop.username ?? shop.uniqueId,
          url: window.location.href,
          follower_count: shop.followerCount ?? shop.fans,
          rating: shop.sellerScore ? parseFloat(shop.sellerScore) : undefined,
          total_products: shop.productCount,
          is_official: shop.isOfficial ?? shop.verified ?? false,
        };
      }
    }
  } catch {
    // fall through to DOM
  }

  const url = window.location.href;
  const usernameMatch = url.match(/@([\w.]+)/);
  if (!usernameMatch) return null;

  const name =
    document.querySelector<HTMLElement>('[data-e2e="user-title"], [class*="shop-name"]')?.textContent?.trim();
  if (!name) return null;

  return {
    external_id: usernameMatch[1],
    name,
    username: usernameMatch[1],
    url,
  };
}
