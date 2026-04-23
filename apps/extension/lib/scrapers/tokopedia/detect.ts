export type TokopediaPageType = "product-list" | "product-detail" | "shop" | "unknown";

export function detectTokopediaPageType(): TokopediaPageType {
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);

  if (path.startsWith("/search") || path.startsWith("/find")) return "product-list";

  // Product detail: /{shop}/{product-slug} — also check for product wrapper elements
  if (segments.length >= 2) {
    // Verify it's actually a product page, not a shop sub-page
    const hasProductData =
      document.querySelector('[data-testid="pdp-product-name"]') !== null ||
      document.querySelector('[data-testid="lblPDPDetailProductName"]') !== null ||
      document.querySelector('h1[data-testid]') !== null;
    if (hasProductData) return "product-detail";
  }

  // Shop page: /{username} — check for shop-specific elements or product grid
  if (segments.length >= 1) {
    const hasShopHeader =
      document.querySelector('[data-testid="shopNameHeader"]') !== null ||
      document.querySelector('[data-testid="shopProductContainer"]') !== null;
    if (hasShopHeader) return "shop";

    // DOM fallback: shop pages have many product links with /{shop}/{product} pattern
    const productLinks = document.querySelectorAll('a[href*="/p/"]').length;
    if (productLinks > 5) return "shop";
  }

  // Fallback: check for search result product wrappers
  const hasProductGrid =
    document.querySelectorAll('[data-testid="divProductWrapper"]').length > 0 ||
    document.querySelectorAll('[data-testid="lnkProductContainer"]').length > 0;
  if (hasProductGrid) return "product-list";

  return "unknown";
}
