export type ShopeePageType = "product-list" | "product-detail" | "shop" | "unknown";

export function detectShopeePageType(): ShopeePageType {
  const path = window.location.pathname;

  // Product detail: URL segment contains -i.shopId.productId
  if (/-i\.\d+\.\d+/.test(path)) {
    return "product-detail";
  }

  // Search / category pages
  if (
    path === "/" ||
    path.startsWith("/search") ||
    path.startsWith("/cari") ||
    path.startsWith("/category") ||
    path.startsWith("/m/search")
  ) {
    return "product-list";
  }

  // Legacy shop URL: /shop/123
  if (/^\/shop\/\d+/.test(path)) {
    return "shop";
  }

  // DOM-based disambiguation for SPA pages (/{shopname})
  const searchItems = document.querySelectorAll('[data-sqe="item"]').length;
  if (searchItems > 0) return "product-list";

  const productLinks = document.querySelectorAll('a[href*="-i."]').length;
  if (productLinks > 5) return "shop";

  return "unknown";
}
