export type TiktokPageType = "product-list" | "product-detail" | "shop" | "unknown";

export function detectTiktokPageType(url: string): TiktokPageType {
  const u = new URL(url);
  const path = u.pathname;
  const host = u.hostname;

  // TikTok Shop dedicated domain
  if (host.includes("shop.tiktok.com")) {
    if (/\/product\//.test(path)) return "product-detail";
    if (/\/store\//.test(path) || path === "/") return "product-list";
    return "shop";
  }

  // tiktok.com routes
  if (/\/@[\w.]+\/shop\/product\//.test(path)) return "product-detail";
  if (/\/@[\w.]+\/shop\/?$/.test(path)) return "product-list";
  if (/\/@[\w.]+/.test(path)) return "shop";

  return "unknown";
}
