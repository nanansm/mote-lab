import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@mote-lab/db";
import type { ShopeeProductsIngest, ShopeeShopIngest, TokopediaProductsIngest, TokopediaShopIngest } from "@mote-lab/shared";

async function upsertProduct(
  marketplace: "shopee" | "tokopedia",
  p: { external_id: string; name: string; url: string; current_price: number; original_price?: number; total_sold: number; rating?: number; review_count?: number; shop_id?: string; category_id?: string; category_name?: string; image_url?: string; location?: string },
) {
  const id = `${marketplace}_${p.external_id}`;
  const now = new Date();

  await db
    .insert(schema.products)
    .values({
      id,
      marketplace,
      externalId: p.external_id,
      name: p.name,
      url: p.url,
      currentPrice: p.current_price,
      originalPrice: p.original_price ?? null,
      totalSold: p.total_sold,
      rating: p.rating ?? null,
      reviewCount: p.review_count ?? null,
      shopId: p.shop_id ?? null,
      categoryId: p.category_id ?? null,
      categoryName: p.category_name ?? null,
      imageUrl: p.image_url ?? null,
      location: p.location ?? null,
      firstSeenAt: now,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.products.marketplace, schema.products.externalId],
      set: {
        name: p.name,
        currentPrice: p.current_price,
        totalSold: p.total_sold,
        rating: p.rating ?? null,
        reviewCount: p.review_count ?? null,
        lastSeenAt: now,
        ...(p.image_url && { imageUrl: p.image_url }),
        ...(p.location && { location: p.location }),
        ...(p.category_name && { categoryName: p.category_name }),
      },
    });

  return id;
}

async function upsertSnapshot(productId: string, price: number | null, soldCount: number | null, rating: number | null, reviewCount: number | null) {
  const now = new Date();
  const wibDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const snapshotDate = wibDate.toISOString().split("T")[0]!;
  const id = `${productId}_${snapshotDate}`;

  await db
    .insert(schema.productSnapshots)
    .values({ id, productId, snapshotDate, price, soldCount, rating, reviewCount, createdAt: now })
    .onConflictDoNothing();
}

async function insertResearch(userId: string, productId: string | null, shopId: string | null, type: string) {
  await db.insert(schema.userResearch).values({
    id: randomUUID(),
    userId,
    productId,
    shopId,
    researchType: type,
    metadata: null,
    createdAt: new Date(),
  });
}

export async function processQueueItems(queueIds: string[]): Promise<void> {
  const items = await db.query.ingestQueue.findMany({
    where: inArray(schema.ingestQueue.id, queueIds),
  });

  for (const item of items) {
    try {
      const raw = item.rawData as Record<string, unknown>;

      if (item.marketplace === "shopee" && item.dataType === "products") {
        const payload = raw as unknown as ShopeeProductsIngest;
        for (const p of payload.data) {
          const productId = await upsertProduct("shopee", p);
          await upsertSnapshot(productId, p.current_price, p.total_sold, p.rating ?? null, p.review_count ?? null);
          await insertResearch(item.userId, productId, null, "product_view");
        }
      } else if (item.marketplace === "shopee" && item.dataType === "shop") {
        const payload = raw as unknown as ShopeeShopIngest;
        const s = payload.data;
        const shopId = `shopee_shop_${s.external_id}`;
        console.log("[Shop Ingest] shopee", s.external_id, { follower_count: s.follower_count, total_products: s.total_products });
        await db.insert(schema.shops).values({
          id: shopId,
          marketplace: "shopee",
          externalId: s.external_id,
          name: s.name,
          username: s.username ?? null,
          url: s.url,
          followerCount: s.follower_count ?? null,
          rating: s.rating ?? null,
          totalProducts: s.total_products ?? null,
          joinedDate: s.joined_date ?? null,
          location: s.location ?? null,
          isOfficial: s.is_official ?? false,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        }).onConflictDoUpdate({
          target: [schema.shops.marketplace, schema.shops.externalId],
          set: {
            name: s.name,
            username: s.username ?? null,
            followerCount: s.follower_count ?? null,
            rating: s.rating ?? null,
            totalProducts: s.total_products ?? null,
            location: s.location ?? null,
            isOfficial: s.is_official ?? false,
            lastSeenAt: new Date(),
          },
        });
        await insertResearch(item.userId, null, shopId, "shop_view");
      } else if (item.marketplace === "tokopedia" && item.dataType === "products") {
        const payload = raw as unknown as TokopediaProductsIngest;
        for (const p of payload.data) {
          const productId = await upsertProduct("tokopedia", p);
          await upsertSnapshot(productId, p.current_price, p.total_sold, p.rating ?? null, p.review_count ?? null);
          await insertResearch(item.userId, productId, null, "product_view");
        }
      } else if (item.marketplace === "tokopedia" && item.dataType === "shop") {
        const payload = raw as unknown as TokopediaShopIngest;
        const s = payload.data;
        const shopId = `tokopedia_shop_${s.external_id}`;
        console.log("[Shop Ingest] tokopedia", s.external_id, { follower_count: s.follower_count, total_products: s.total_products });
        await db.insert(schema.shops).values({
          id: shopId,
          marketplace: "tokopedia",
          externalId: s.external_id,
          name: s.name,
          username: s.username ?? null,
          url: s.url,
          followerCount: s.follower_count ?? null,
          rating: s.rating ?? null,
          totalProducts: s.total_products ?? null,
          joinedDate: s.joined_date ?? null,
          location: s.location ?? null,
          isOfficial: s.is_official ?? false,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        }).onConflictDoUpdate({
          target: [schema.shops.marketplace, schema.shops.externalId],
          set: {
            name: s.name,
            username: s.username ?? null,
            followerCount: s.follower_count ?? null,
            rating: s.rating ?? null,
            totalProducts: s.total_products ?? null,
            location: s.location ?? null,
            isOfficial: s.is_official ?? false,
            lastSeenAt: new Date(),
          },
        });
        await insertResearch(item.userId, null, shopId, "shop_view");
      }

      await db
        .update(schema.ingestQueue)
        .set({ status: "processed", processedAt: new Date() })
        .where(eq(schema.ingestQueue.id, item.id));
    } catch (err) {
      await db
        .update(schema.ingestQueue)
        .set({ status: "error", errorMessage: String(err) })
        .where(eq(schema.ingestQueue.id, item.id));
    }
  }
}
