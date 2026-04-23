import type { TiktokProduct } from "../../types";

export function scrapeTiktokProductDetail(): TiktokProduct | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = (window as any).__INITIAL_STATE__ ?? (window as any).SIGI_STATE;
    if (state) {
      const item =
        state?.ProductModule?.product ??
        state?.ShopModule?.productDetail ??
        state?.productDetail?.productInfo;
      if (item?.id ?? item?.productId) {
        const id = `${item.id ?? item.productId}`;
        return {
          external_id: id,
          name: item.title ?? item.name ?? "",
          url: window.location.href,
          current_price: item.priceInfo?.price ? parseFloat(item.priceInfo.price) : 0,
          original_price: item.priceInfo?.marketPrice ? parseFloat(item.priceInfo.marketPrice) : undefined,
          total_sold: item.sales ?? item.soldCount ?? 0,
          rating: item.rating?.averageStar ? parseFloat(item.rating.averageStar) : undefined,
          review_count: item.rating?.commentCount,
          shop_id: item.shopId?.toString(),
          shop_name: item.shopName,
          category_id: item.categoryId?.toString(),
          category_name: item.categoryName,
          image_url: item.coverUrl ?? item.images?.[0],
        };
      }
    }
  } catch {
    // fall through to DOM
  }

  const url = window.location.href;
  const idMatch = url.match(/\/product\/(\w+)/);
  if (!idMatch) return null;

  const name =
    document.querySelector<HTMLElement>('[data-e2e="product-title"], h1[class*="title"]')?.textContent?.trim();
  const priceText = document
    .querySelector<HTMLElement>('[data-e2e="product-price"], [class*="price"]')
    ?.textContent?.replace(/[^0-9.]/g, "");

  if (!name) return null;
  return {
    external_id: idMatch[1],
    name,
    url,
    current_price: parseFloat(priceText ?? "0") || 0,
    total_sold: 0,
  };
}
