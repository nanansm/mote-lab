import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  bigint,
  date,
  unique,
  real,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// better-auth managed tables
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// App tables
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(), // 'trial' | 'starter' | 'pro' | 'lifetime'
  status: text("status").notNull().default("active"), // 'active' | 'expired' | 'cancelled'
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodEnd: timestamp("current_period_end"),
  ipaymuInvoiceId: text("ipaymu_invoice_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usageQuota = pgTable(
  "usage_quota",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    researchCount: integer("research_count").notNull().default(0),
  },
  (table) => [unique().on(table.userId, table.date)]
);

// Relations (TypeScript only — no DB migration needed)
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  sessions: many(sessions),
  accounts: many(accounts),
  usageQuota: many(usageQuota),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const usageQuotaRelations = relations(usageQuota, ({ one }) => ({
  user: one(users, {
    fields: [usageQuota.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type UsageQuota = typeof usageQuota.$inferSelect;

// ==================== PHASE 1 TABLES ====================

// Extension auth tokens (long-lived, stored in chrome.storage)
export const extensionTokens = pgTable(
  "extension_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(), // SHA-256 hex hash of the raw token
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (table) => [
    index("extension_tokens_user_idx").on(table.userId),
    index("extension_tokens_token_idx").on(table.token),
  ],
);

// Marketplace products
export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(), // e.g. 'shopee_123456789'
    marketplace: text("marketplace").notNull(), // 'shopee' | 'tokopedia'
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug"),
    url: text("url").notNull(),
    shopId: text("shop_id"),
    categoryId: text("category_id"),
    categoryName: text("category_name"),
    imageUrl: text("image_url"),
    currentPrice: bigint("current_price", { mode: "number" }),
    originalPrice: bigint("original_price", { mode: "number" }),
    totalSold: bigint("total_sold", { mode: "number" }),
    rating: real("rating"),
    reviewCount: integer("review_count"),
    location: text("location"),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  },
  (table) => [
    unique("products_marketplace_external_id_uq").on(table.marketplace, table.externalId),
    index("products_marketplace_sold_idx").on(table.marketplace, table.totalSold),
    index("products_category_idx").on(table.categoryId),
    index("products_shop_idx").on(table.shopId),
  ],
);

// Marketplace shops
export const shops = pgTable(
  "shops",
  {
    id: text("id").primaryKey(), // e.g. 'shopee_shop_789'
    marketplace: text("marketplace").notNull(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    username: text("username"),
    url: text("url").notNull(),
    followerCount: bigint("follower_count", { mode: "number" }),
    rating: real("rating"),
    totalProducts: bigint("total_products", { mode: "number" }),
    joinedDate: text("joined_date"),
    location: text("location"),
    isOfficial: boolean("is_official").default(false),
    reviewCount: bigint("review_count", { mode: "number" }).notNull().default(0),
    totalSold: bigint("total_sold", { mode: "number" }).notNull().default(0),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  },
  (table) => [
    unique("shops_marketplace_external_id_uq").on(table.marketplace, table.externalId),
    index("shops_marketplace_idx").on(table.marketplace),
  ],
);

// Daily product price/sold snapshots for history charts
// NOTE: Created as a partitioned table by the SQL migration — Drizzle handles queries, not DDL.
export const productSnapshots = pgTable(
  "product_snapshots",
  {
    id: text("id").primaryKey(), // '{productId}_{date}'
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    snapshotDate: date("snapshot_date").notNull(),
    price: bigint("price", { mode: "number" }),
    soldCount: bigint("sold_count", { mode: "number" }),
    rating: real("rating"),
    reviewCount: integer("review_count"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("snapshots_product_date_uq").on(table.productId, table.snapshotDate),
    index("snapshots_product_date_idx").on(table.productId, table.snapshotDate),
  ],
);

// Research activity log per user
export const userResearch = pgTable(
  "user_research",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    shopId: text("shop_id"),
    researchType: text("research_type").notNull(), // 'product_view' | 'shop_view' | 'search'
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_research_user_created_idx").on(table.userId, table.createdAt),
  ],
);

// User-saved products and shops
export const savedItems = pgTable(
  "saved_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(), // 'product' | 'shop'
    itemId: text("item_id").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("saved_items_user_type_item_uq").on(table.userId, table.itemType, table.itemId),
  ],
);

// Raw scrape queue for background processing
export const ingestQueue = pgTable(
  "ingest_queue",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    marketplace: text("marketplace").notNull(), // 'shopee' | 'tokopedia'
    dataType: text("data_type").notNull(), // 'products' | 'shop'
    rawData: jsonb("raw_data").$type<Record<string, unknown>>().notNull(),
    status: text("status").notNull().default("pending"), // 'pending' | 'processed' | 'error'
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    processedAt: timestamp("processed_at"),
  },
  (table) => [
    index("ingest_queue_status_created_idx").on(table.status, table.createdAt),
    index("ingest_queue_user_idx").on(table.userId),
  ],
);

// ==================== PHASE 1 RELATIONS ====================

export const extensionTokensRelations = relations(extensionTokens, ({ one }) => ({
  user: one(users, { fields: [extensionTokens.userId], references: [users.id] }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  snapshots: many(productSnapshots),
  savedBy: many(savedItems),
}));

export const shopsRelations = relations(shops, ({ many }) => ({
  savedBy: many(savedItems),
}));

export const productSnapshotsRelations = relations(productSnapshots, ({ one }) => ({
  product: one(products, { fields: [productSnapshots.productId], references: [products.id] }),
}));

export const userResearchRelations = relations(userResearch, ({ one }) => ({
  user: one(users, { fields: [userResearch.userId], references: [users.id] }),
}));

export const savedItemsRelations = relations(savedItems, ({ one }) => ({
  user: one(users, { fields: [savedItems.userId], references: [users.id] }),
}));

export const ingestQueueRelations = relations(ingestQueue, ({ one }) => ({
  user: one(users, { fields: [ingestQueue.userId], references: [users.id] }),
}));

// Update existing usersRelations to include new tables
// (Drizzle merges relations defined separately — no need to modify original)

// ==================== PHASE 1 TYPES ====================

export type ExtensionToken = typeof extensionTokens.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type ProductSnapshot = typeof productSnapshots.$inferSelect;
export type NewProductSnapshot = typeof productSnapshots.$inferInsert;
export type UserResearch = typeof userResearch.$inferSelect;
export type NewUserResearch = typeof userResearch.$inferInsert;
export type SavedItem = typeof savedItems.$inferSelect;
export type IngestQueue = typeof ingestQueue.$inferSelect;
export type NewIngestQueue = typeof ingestQueue.$inferInsert;
