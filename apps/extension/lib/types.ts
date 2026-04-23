// Inline types — mirrors packages/shared/src/schemas/ingest.ts
// Keep in sync manually when schemas change.

export interface ShopeeProduct {
  external_id: string;
  name: string;
  url: string;
  current_price: number;
  original_price?: number;
  total_sold: number;
  rating?: number;
  review_count?: number;
  shop_id?: string;
  shop_name?: string;
  category_id?: string;
  category_name?: string;
  image_url?: string;
  location?: string;
}

export interface ShopeeShop {
  external_id: string;
  name: string;
  username?: string;
  url: string;
  follower_count?: number;
  rating?: number;
  total_products?: number;
  joined_date?: string;
  location?: string;
  is_official?: boolean;
}

export interface TiktokProduct {
  external_id: string;
  name: string;
  url: string;
  current_price: number;
  original_price?: number;
  total_sold: number;
  rating?: number;
  review_count?: number;
  shop_id?: string;
  shop_name?: string;
  category_id?: string;
  category_name?: string;
  image_url?: string;
  location?: string;
}

export interface TiktokShop {
  external_id: string;
  name: string;
  username?: string;
  url: string;
  follower_count?: number;
  rating?: number;
  total_products?: number;
  joined_date?: string;
  location?: string;
  is_official?: boolean;
}

export interface ProductsIngestPayload<T> {
  scraped_at: string;
  page_url: string;
  data: T[];
}

export interface ShopIngestPayload<T> {
  scraped_at: string;
  page_url: string;
  data: T;
}

export interface VerifyResponse {
  valid: boolean;
  user: { id: string; email: string; name: string; plan: string };
  quota: { used: number; limit: number; remaining: number; resetAt: string };
}

export interface IngestResponse {
  ok: boolean;
  queued?: number;
  quotaRemaining?: number;
  error?: string;
}

export interface StoredAuth {
  token: string;
  user: { id: string; email: string; name: string; plan: string };
  quota: { used: number; limit: number; remaining: number; resetAt: string };
  savedAt: number;
}
