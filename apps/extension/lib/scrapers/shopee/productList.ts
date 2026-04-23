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

function parseFromDOM(): ShopeeProduct[] {
  const cards = document.querySelectorAll<HTMLElement>('[data-sqe="item"]');
  console.log("[Shopee Scraper] Found", cards.length, "product cards");

  const results: ShopeeProduct[] = [];

  cards.forEach((card, idx) => {
    try {
      const link = card.querySelector<HTMLAnchorElement>('a[href*="-i."]');
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const idMatch = href.match(/-i\.(\d+)\.(\d+)/);
      if (!idMatch) return;
      const [, shopId, productId] = idMatch;

      const url = new URL(href, "https://shopee.co.id").toString();

      const ariaLabel = link.getAttribute("aria-label") || "";
      const img = card.querySelector("img");
      const imgAlt = img?.getAttribute("alt") || "";
      const imageUrl = img?.getAttribute("src") || img?.srcset?.split(" ")[0] || "";

      const text = card.innerText || "";
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

      // Name: aria-label > img alt > first text line
      const name = ariaLabel.replace(/^View product:\s*/i, "").trim()
        || imgAlt.trim()
        || lines[0]
        || "";
      if (!name) return;

      // Price: look for "Rp" line
      let currentPrice = 0;
      const rpIdx = lines.findIndex((l) => l === "Rp" || l.startsWith("Rp"));
      if (rpIdx >= 0) {
        const priceStr = lines[rpIdx] === "Rp" ? lines[rpIdx + 1] : lines[rpIdx].replace("Rp", "").trim();
        currentPrice = parseInt(priceStr.replace(/\./g, ""), 10) || 0;
      }

      // Discount: "-XX%"
      const discountLine = lines.find((l) => /^-\d+%$/.test(l));
      const discountPercent = discountLine ? parseInt(discountLine.replace(/[-%]/g, ""), 10) : 0;

      const originalPrice = discountPercent > 0
        ? Math.round(currentPrice / (1 - discountPercent / 100))
        : currentPrice;

      // Rating: single decimal like "4.9"
      const rating = parseFloat(lines.find((l) => /^\d\.\d$/.test(l)) ?? "") || null;

      // Sold count
      const soldLine = lines.find((l) => l.includes("Terjual"));
      const totalSold = parseSoldCount(soldLine || "");

      // Location: city/kab/kota keywords
      const locationLine = lines.find((l) =>
        /^(Kab\.|Kota|Jakarta|Tangerang|Bandung|Surabaya|Medan|Semarang|Yogyakarta|Bali|Bekasi|Depok|Bogor)/i.test(l)
      ) || "";

      results.push({
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
      });
    } catch (err) {
      console.error("[Shopee Scraper] Error parsing item", idx, err);
    }
  });

  console.log("[Shopee Scraper] Parsed", results.length, "products from DOM");
  return results;
}

export function scrapeShopeeProductList(): ShopeeProduct[] {
  const fromNextData = parseFromNextData();
  if (fromNextData.length > 0) {
    console.log("[Shopee Scraper] Using __NEXT_DATA__, found", fromNextData.length, "products");
    return fromNextData;
  }
  console.log("[Shopee Scraper] __NEXT_DATA__ empty, falling back to DOM");
  return parseFromDOM();
}
