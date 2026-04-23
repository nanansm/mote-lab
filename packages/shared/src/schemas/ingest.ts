import { z } from "zod";

// ── Shopee ──────────────────────────────────────────────────────────────────

export const shopeeProductSchema = z.object({
  external_id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  current_price: z.number().int().nonnegative(),
  original_price: z.number().int().nonnegative().optional(),
  total_sold: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5).optional(),
  review_count: z.number().int().nonnegative().optional(),
  shop_id: z.string().optional(),
  shop_name: z.string().optional(),
  category_id: z.string().optional(),
  category_name: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
});

export const shopeeShopSchema = z.object({
  external_id: z.string().min(1),
  name: z.string().min(1),
  username: z.string().optional(),
  url: z.string().url(),
  follower_count: z.number().int().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  total_products: z.number().int().nonnegative().optional(),
  joined_date: z.string().optional(),
  location: z.string().optional(),
  is_official: z.boolean().optional(),
});

export const shopeeProductsIngestSchema = z.object({
  scraped_at: z.string().datetime(),
  page_url: z.string().url(),
  data: z.array(shopeeProductSchema).min(1).max(100),
});

export const shopeeShopIngestSchema = z.object({
  scraped_at: z.string().datetime(),
  page_url: z.string().url(),
  data: shopeeShopSchema,
});

// ── TikTok Shop ─────────────────────────────────────────────────────────────

export const tiktokProductSchema = z.object({
  external_id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  current_price: z.number().int().nonnegative(),
  original_price: z.number().int().nonnegative().optional(),
  total_sold: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5).optional(),
  review_count: z.number().int().nonnegative().optional(),
  shop_id: z.string().optional(),
  shop_name: z.string().optional(),
  category_id: z.string().optional(),
  category_name: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
});

export const tiktokShopSchema = z.object({
  external_id: z.string().min(1),
  name: z.string().min(1),
  username: z.string().optional(),
  url: z.string().url(),
  follower_count: z.number().int().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  total_products: z.number().int().nonnegative().optional(),
  joined_date: z.string().optional(),
  location: z.string().optional(),
  is_official: z.boolean().optional(),
});

export const tiktokProductsIngestSchema = z.object({
  scraped_at: z.string().datetime(),
  page_url: z.string().url(),
  data: z.array(tiktokProductSchema).min(1).max(100),
});

export const tiktokShopIngestSchema = z.object({
  scraped_at: z.string().datetime(),
  page_url: z.string().url(),
  data: tiktokShopSchema,
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type ShopeeProduct = z.infer<typeof shopeeProductSchema>;
export type ShopeeShop = z.infer<typeof shopeeShopSchema>;
export type ShopeeProductsIngest = z.infer<typeof shopeeProductsIngestSchema>;
export type ShopeeShopIngest = z.infer<typeof shopeeShopIngestSchema>;

export type TiktokProduct = z.infer<typeof tiktokProductSchema>;
export type TiktokShop = z.infer<typeof tiktokShopSchema>;
export type TiktokProductsIngest = z.infer<typeof tiktokProductsIngestSchema>;
export type TiktokShopIngest = z.infer<typeof tiktokShopIngestSchema>;
