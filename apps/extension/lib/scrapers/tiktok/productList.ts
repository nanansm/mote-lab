import type { TiktokProduct } from "../../types";

// TikTok injects product data into window.__INITIAL_STATE__ or SIGI_STATE
function parseFromWindowState(): TiktokProduct[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = (window as any).__INITIAL_STATE__ ?? (window as any).SIGI_STATE;
    if (!state) return [];

    const products: TiktokProduct[] = [];
    const productMap =
      state?.ShopModule?.productList ??
      state?.ProductModule?.productList ??
      state?.shopProduct?.products ??
      {};

    for (const [id, item] of Object.entries(productMap)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = item as any;
      if (!p?.title) continue;
      products.push({
        external_id: `${id}`,
        name: p.title ?? "",
        url: window.location.href,
        current_price: p.priceInfo?.price ? parseFloat(p.priceInfo.price) : 0,
        original_price: p.priceInfo?.marketPrice ? parseFloat(p.priceInfo.marketPrice) : undefined,
        total_sold: p.sales ?? p.soldCount ?? 0,
        rating: p.rating?.averageStar ? parseFloat(p.rating.averageStar) : undefined,
        review_count: p.rating?.commentCount,
        shop_id: p.shopId?.toString(),
        shop_name: p.shopName,
        category_id: p.categoryId?.toString(),
        category_name: p.categoryName,
        image_url: p.coverUrl ?? p.images?.[0],
      });
    }
    return products;
  } catch {
    return [];
  }
}

function parseFromDOM(): TiktokProduct[] {
  const cards = document.querySelectorAll<HTMLElement>('[class*="product-card"], [data-e2e="product-item"]');
  const results: TiktokProduct[] = [];

  cards.forEach((card) => {
    const link = card.querySelector<HTMLAnchorElement>("a");
    const productIdMatch = link?.href.match(/\/product\/(\w+)/);
    if (!productIdMatch) return;

    const name = card.querySelector<HTMLElement>('[class*="title"], [data-e2e="product-title"]')?.textContent?.trim();
    const priceText = card
      .querySelector<HTMLElement>('[class*="price"], [data-e2e="product-price"]')
      ?.textContent?.replace(/[^0-9.]/g, "");

    if (!name) return;
    results.push({
      external_id: productIdMatch[1],
      name,
      url: link?.href ?? window.location.href,
      current_price: parseFloat(priceText ?? "0") || 0,
      total_sold: 0,
    });
  });

  return results;
}

export function scrapeTiktokProductList(): TiktokProduct[] {
  const fromState = parseFromWindowState();
  if (fromState.length > 0) return fromState;
  return parseFromDOM();
}
