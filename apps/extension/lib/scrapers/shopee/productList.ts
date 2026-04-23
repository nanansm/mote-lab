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

function parseFromDOM(): ShopeeProduct[] {
  const cards = document.querySelectorAll<HTMLElement>('[data-sqe="item"]');
  const results: ShopeeProduct[] = [];

  cards.forEach((card) => {
    const link = card.querySelector<HTMLAnchorElement>("a[href*='/product/']");
    if (!link) return;

    const match = link.href.match(/\/product\/(\d+)\/(\d+)/);
    if (!match) return;
    const [, shopId, itemId] = match;

    const name = card.querySelector('[data-sqe="name"]')?.textContent?.trim() ?? "";
    const priceText = card.querySelector('[data-sqe="price"]')?.textContent?.replace(/[^0-9]/g, "") ?? "0";
    const soldText = card.querySelector('[data-sqe="sold"]')?.textContent ?? "0";
    const soldNum = parseInt(soldText.replace(/[^0-9]/g, "") || "0", 10);

    if (!name) return;
    results.push({
      external_id: itemId,
      name,
      url: `https://shopee.co.id/product/${shopId}/${itemId}`,
      current_price: parseInt(priceText, 10),
      total_sold: soldNum,
      shop_id: shopId,
    });
  });

  return results;
}

export function scrapeShopeeProductList(): ShopeeProduct[] {
  const fromNextData = parseFromNextData();
  if (fromNextData.length > 0) return fromNextData;
  return parseFromDOM();
}
