-- Phase 1: Extension tokens, products, shops, snapshots, research, saved, ingest queue

CREATE TABLE "extension_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "token" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "last_used_at" timestamp,
  CONSTRAINT "extension_tokens_token_unique" UNIQUE("token")
);
CREATE INDEX "extension_tokens_user_idx" ON "extension_tokens"("user_id");
CREATE INDEX "extension_tokens_token_idx" ON "extension_tokens"("token");

--> statement-breakpoint
CREATE TABLE "products" (
  "id" text PRIMARY KEY NOT NULL,
  "marketplace" text NOT NULL,
  "external_id" text NOT NULL,
  "name" text NOT NULL,
  "slug" text,
  "url" text NOT NULL,
  "shop_id" text,
  "category_id" text,
  "category_name" text,
  "image_url" text,
  "current_price" integer,
  "original_price" integer,
  "total_sold" integer,
  "rating" real,
  "review_count" integer,
  "location" text,
  "first_seen_at" timestamp DEFAULT now() NOT NULL,
  "last_seen_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "products_marketplace_external_id_uq" UNIQUE("marketplace", "external_id")
);
CREATE INDEX "products_marketplace_sold_idx" ON "products"("marketplace", "total_sold");
CREATE INDEX "products_category_idx" ON "products"("category_id");
CREATE INDEX "products_shop_idx" ON "products"("shop_id");

--> statement-breakpoint
CREATE TABLE "shops" (
  "id" text PRIMARY KEY NOT NULL,
  "marketplace" text NOT NULL,
  "external_id" text NOT NULL,
  "name" text NOT NULL,
  "username" text,
  "url" text NOT NULL,
  "follower_count" integer,
  "rating" real,
  "total_products" integer,
  "joined_date" text,
  "location" text,
  "is_official" boolean DEFAULT false,
  "first_seen_at" timestamp DEFAULT now() NOT NULL,
  "last_seen_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "shops_marketplace_external_id_uq" UNIQUE("marketplace", "external_id")
);
CREATE INDEX "shops_marketplace_idx" ON "shops"("marketplace");

--> statement-breakpoint
-- product_snapshots: partitioned by month for query performance
CREATE TABLE "product_snapshots" (
  "id" text NOT NULL,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "snapshot_date" date NOT NULL,
  "price" integer,
  "sold_count" integer,
  "rating" real,
  "review_count" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "snapshots_product_date_uq" UNIQUE("product_id", "snapshot_date"),
  PRIMARY KEY ("id", "snapshot_date")
) PARTITION BY RANGE (snapshot_date);

CREATE TABLE "product_snapshots_2026_04" PARTITION OF "product_snapshots"
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE "product_snapshots_2026_05" PARTITION OF "product_snapshots"
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE "product_snapshots_2026_06" PARTITION OF "product_snapshots"
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE "product_snapshots_2026_07" PARTITION OF "product_snapshots"
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE "product_snapshots_2026_08" PARTITION OF "product_snapshots"
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE "product_snapshots_2026_09" PARTITION OF "product_snapshots"
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE INDEX "snapshots_product_date_idx" ON "product_snapshots"("product_id", "snapshot_date");

--> statement-breakpoint
CREATE TABLE "user_research" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "product_id" text,
  "shop_id" text,
  "research_type" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "user_research_user_created_idx" ON "user_research"("user_id", "created_at" DESC);

--> statement-breakpoint
CREATE TABLE "saved_items" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "item_type" text NOT NULL,
  "item_id" text NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "saved_items_user_type_item_uq" UNIQUE("user_id", "item_type", "item_id")
);

--> statement-breakpoint
CREATE TABLE "ingest_queue" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "marketplace" text NOT NULL,
  "data_type" text NOT NULL,
  "raw_data" jsonb NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "processed_at" timestamp
);
CREATE INDEX "ingest_queue_status_created_idx" ON "ingest_queue"("status", "created_at") WHERE status = 'pending';
CREATE INDEX "ingest_queue_user_idx" ON "ingest_queue"("user_id");
