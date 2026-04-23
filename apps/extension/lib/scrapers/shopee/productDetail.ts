import type { ShopeeProduct } from "../../types";

export function scrapeShopeeProductDetail(): ShopeeProduct | null {
  try {
    const el = document.getElementById("__NEXT_DATA__");
    if (el?.textContent) {
      const json = JSON.parse(el.textContent);
      const item = json?.props?.pageProps?.initialData?.result?.item ?? json?.props?.pageProps?.product;
      if (item?.itemid) {
        const shopId = item.shopid?.toString() ?? "";
        return {
          external_id: `${item.itemid}`,
          name: item.name ?? "",
          url: window.location.href,
          current_price: (item.price ?? 0) / 100000,
          original_price: item.price_before_discount ? item.price_before_discount / 100000 : undefined,
          total_sold: item.historical_sold ?? 0,
          rating: item.item_rating?.rating_star,
          review_count: item.item_rating?.rating_count?.reduce((a: number, b: number) => a + b, 0),
          shop_id: shopId,
          shop_name: item.shop_name,
          category_id: item.cats?.[0]?.catid?.toString(),
          category_name: item.cats?.[0]?.name,
          image_url: item.image ? `https://cf.shopee.co.id/file/${item.image}_tn` : undefined,
          location: item.shop_location,
        };
      }
    }
  } catch {
    // fall through to DOM
  }

  // DOM fallback
  const url = window.location.href;
  const match = url.match(/\/product\/(\d+)\/(\d+)/);
  if (!match) return null;
  const [, shopId, itemId] = match;

  const name = document.querySelector<HTMLElement>('[class*="product-briefing"] h1')?.textContent?.trim() ?? "";
  const priceText =
    document.querySelector<HTMLElement>('[class*="product-price_price"]')?.textContent?.replace(/[^0-9]/g, "") ?? "0";

  if (!name) return null;
  return {
    external_id: itemId,
    name,
    url,
    current_price: parseInt(priceText, 10),
    total_sold: 0,
    shop_id: shopId,
  };
}
