import { detectShopeePageType } from "./detect";
import type { ShopeeProduct } from "../../types";

interface NextDataItem {
  itemid?: number;
  shopid?: number;
  name?: string;
  price?: number;
  price_before_discount?: number;
  historical_sold?: number;
  item_rating?: { rating_star?: number; rating_count?: number[] };
  shopname?: string;
  cats?: Array<{ catid?: number; name?: string }>;
  image?: string;
  shop_location?: string;
}

function parseFromNextData(): ShopeeProduct[] {
  try {
    const el = document.getElementById("__NEXT_DATA__");
    if (!el?.textContent) return [];
    const json = JSON.parse(el.textContent);
    const items: NextDataItem[] =
      json?.props?.pageProps?.initialData?.result?.items ??
      json?.props?.pageProps?.data?.sections?.[0]?.data?.item ?? [];

    return items.flatMap((item) => {
      if (!item.itemid || !item.name) return [];
      const shopId = item.shopid?.toString() ?? "";
      return [
        {
          external_id: `${item.itemid}`,
          name: item.name,
          url: `https://shopee.co.id/product/${shopId}/${item.itemid}`,
          current_price: (item.price ?? 0) / 100000,
          original_price: item.price_before_discount ? item.price_before_discount / 100000 : undefined,
          total_sold: item.historical_sold ?? 0,
          rating: item.item_rating?.rating_star,
          review_count: item.item_rating?.rating_count?.reduce((a, b) => a + b, 0),
          shop_id: shopId,
          shop_name: item.shopname,
          category_id: item.cats?.[0]?.catid?.toString(),
          category_name: item.cats?.[0]?.name,
          image_url: item.image ? `https://cf.shopee.co.id/file/${item.image}_tn` : undefined,
          location: item.shop_location,
        } satisfies ShopeeProduct,
      ];
    });
  } catch {
    return [];
  }
}

function parseSoldCount(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/Terjual/i, "").trim();

  if (/RB/i.test(cleaned)) {
    const num = parseFloat(cleaned.replace(/[^\d,]/g, "").replace(",", "."));
    return Math.round(num * 1000);
  }

  if (/JT/i.test(cleaned)) {
    const num = parseFloat(cleaned.replace(/[^\d,]/g, "").replace(",", "."));
    return Math.round(num * 1_000_000);
  }

  const num = parseInt(cleaned.replace(/[^\d]/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

function parseProductCard(item: Element): ShopeeProduct | null {
  try {
    const link = item.querySelector<HTMLAnchorElement>('a[href*="-i."]');
    if (!link) return null;

    const href = link.getAttribute("href") || "";
    const idMatch = href.match(/-i\.(\d+)\.(\d+)/);
    if (!idMatch) return null;
    const [, shopId, productId] = idMatch;

    const url = new URL(href, "https://shopee.co.id").toString();

    const ariaLabel = link.getAttribute("aria-label") || "";
    const img = item.querySelector("img");
    const imgAlt = img?.getAttribute("alt") || "";
    const imageUrl = img?.getAttribute("src") || img?.srcset?.split(" ")[0] || "";

    const text = (item as HTMLElement).innerText || "";
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    const name = ariaLabel.replace(/^View product:\s*/i, "").trim()
      || imgAlt.trim()
      || lines[0]
      || "";
    if (!name) return null;

    let currentPrice = 0;
    const rpIdx = lines.findIndex((l) => l === "Rp" || l.startsWith("Rp"));
    if (rpIdx >= 0) {
      const priceStr = lines[rpIdx] === "Rp" ? lines[rpIdx + 1] : lines[rpIdx].replace("Rp", "").trim();
      currentPrice = parseInt((priceStr ?? "").replace(/\./g, ""), 10) || 0;
    }

    const discountLine = lines.find((l) => /^-\d+%$/.test(l));
    const discountPercent = discountLine ? parseInt(discountLine.replace(/[-%]/g, ""), 10) : 0;
    const originalPrice = discountPercent > 0
      ? Math.round(currentPrice / (1 - discountPercent / 100))
      : currentPrice;

    const rating = parseFloat(lines.find((l) => /^\d\.\d$/.test(l)) ?? "") || null;

    const soldLine = lines.find((l) => /terjual/i.test(l));
    const totalSold = parseSoldCount(soldLine || "");

    const locationLine = lines.find((l) =>
      /^(Kab\.|Kota|Jakarta|Tangerang|Bandung|Surabaya|Medan|Semarang|Yogyakarta|Bali|Bekasi|Depok|Bogor|Luar Negeri|Overseas)/i.test(l)
    ) || "";

    return {
      external_id: productId,
      name,
      url,
      current_price: currentPrice,
      original_price: originalPrice,
      total_sold: totalSold,
      rating: rating ?? undefined,
      shop_id: shopId,
      image_url: imageUrl,
      location: locationLine,
    };
  } catch (err) {
    console.error("[Shopee Scraper] Error parsing card:", err);
    return null;
  }
}

function scrapeSearchPage(): ShopeeProduct[] {
  const cards = document.querySelectorAll<HTMLElement>('[data-sqe="item"]');
  console.log("[Shopee Scraper] Search page: found", cards.length, "cards");
  return Array.from(cards).map(parseProductCard).filter((p): p is ShopeeProduct => p !== null);
}

function scrapeShopPage(): ShopeeProduct[] {
  // Collect unique parent containers for each product link
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="-i."]');
  const cardsSet = new Set<Element>();

  links.forEach((link) => {
    const card =
      link.closest("li") ||
      link.closest('div[class*="duration-100"]') ||
      link.closest('[role="group"]') ||
      link.parentElement?.parentElement;
    if (card) cardsSet.add(card);
  });

  console.log("[Shopee Scraper] Shop page: found", cardsSet.size, "unique cards");
  return Array.from(cardsSet).map(parseProductCard).filter((p): p is ShopeeProduct => p !== null);
}

export function scrapeShopeeProductList(): ShopeeProduct[] {
  // Try __NEXT_DATA__ first (fastest and most reliable)
  const fromNextData = parseFromNextData();
  if (fromNextData.length > 0) {
    console.log("[Shopee Scraper] Using __NEXT_DATA__, found", fromNextData.length, "products");
    return fromNextData;
  }

  const pageType = detectShopeePageType();
  console.log("[Shopee Scraper] Falling back to DOM, page type:", pageType);

  if (pageType === "product-list") return scrapeSearchPage();
  if (pageType === "shop") return scrapeShopPage();

  console.log("[Shopee Scraper] Page type not supported for list scraping");
  return [];
}
