export type TokopediaPageType = "search" | "shop" | "product" | "unknown";

const BLOCKLIST = [
  "help", "about", "contact", "login", "register", "cart", "p",
  "category", "categories", "discovery", "play", "search", "find",
  "promo", "flash-sale", "tokopoints", "gold-merchant", "official-store",
];

export function detectTokopediaPageType(): TokopediaPageType {
  const { hostname, pathname } = window.location;
  if (!hostname.includes("tokopedia.com")) return "unknown";

  if (pathname.startsWith("/search") || pathname.startsWith("/find")) return "search";

  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return "unknown";
  if (BLOCKLIST.includes(parts[0])) return "unknown";

  if (parts.length >= 2) return "product";
  if (parts.length === 1) return "shop";

  return "unknown";
}
