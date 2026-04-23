export type TokopediaPageType = "product-list" | "product-detail" | "shop" | "unknown";

export function detectTokopediaPageType(): TokopediaPageType {
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);

  if (path.startsWith("/search") || path.startsWith("/find")) return "product-list";

  // /{shop}/{product-slug} → product detail
  if (segments.length >= 2) return "product-detail";

  // /{shop} → shop page
  if (segments.length === 1) return "shop";

  return "unknown";
}
