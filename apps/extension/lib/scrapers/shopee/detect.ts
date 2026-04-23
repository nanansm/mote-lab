export type ShopeePageType = "product-list" | "product-detail" | "shop" | "unknown";

export function detectShopeePageType(url: string): ShopeePageType {
  const u = new URL(url);
  const path = u.pathname;

  // Product detail: /product/123/456 or /-i.123.456
  if (/\/product\/\d+\/\d+/.test(path) || /\/-i\.\d+\.\d+/.test(path)) {
    return "product-detail";
  }

  // Shop page: /shop/123 or /<username>
  if (/^\/shop\/\d+/.test(path)) {
    return "shop";
  }

  // Search / category listing
  if (path === "/" || path.startsWith("/search") || path.startsWith("/category") || path.startsWith("/m/search")) {
    return "product-list";
  }

  return "unknown";
}
