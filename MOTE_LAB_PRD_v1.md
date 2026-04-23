# 📋 PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Mote LAB — Marketplace Research Tool

**Version:** 1.0.0 — Phase 0 + Phase 1
**Stack:** Next.js 15 · Drizzle ORM · better-auth · PostgreSQL · Redis · TailwindCSS · shadcn/ui · Plasmo (Chrome Extension)
**Deployment Target:** Easypanel (lightweight, single VPS)
**Status:** Ready for Development
**Owner:** Nanan (smnanan@motekreatif.com)

---

## 📌 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Business Model & Pricing](#2-business-model--pricing)
3. [Tech Stack & Justifikasi](#3-tech-stack--justifikasi)
4. [System Architecture](#4-system-architecture)
5. [Phase 0 — Foundation](#5-phase-0--foundation)
6. [Phase 1 — Extension MVP Shopee + TikTok Shop](#6-phase-1--extension-mvp-shopee--tiktok-shop)
7. [Database Schema](#7-database-schema)
8. [API Routes](#8-api-routes)
9. [Chrome Extension Spec](#9-chrome-extension-spec)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [Easypanel Deployment](#11-easypanel-deployment)
12. [Environment Variables](#12-environment-variables)
13. [Security & Anti-Detection](#13-security--anti-detection)
14. [Performance & Resource Optimization](#14-performance--resource-optimization)
15. [Legal & Compliance](#15-legal--compliance)
16. [Implementation Notes for Claude Code](#16-implementation-notes-for-claude-code)

---

## 1. PROJECT OVERVIEW

### 1.1 Identity

| Field | Value |
|---|---|
| App Name | **Mote LAB** |
| Tagline | "Marketplace research yang bicara dengan data, bukan feeling" |
| Type | SaaS Web App + Chrome Extension (Hybrid Architecture) |
| Primary Language | Indonesia (UI), English (kode & docs) |
| Target Market | Seller mid-tier & affiliate Indonesia |

### 1.2 Description

**Mote LAB** adalah tool riset produk marketplace berbasis hybrid architecture: Chrome extension yang scrape data dari browser user (model Tokpee/Shoptik), tapi semua data ter-aggregate di server kamu sebagai **collective intelligence database** (model Kalodata/Fastmoss). Hasilnya: tools yang punya data sekomprehensif Kalodata tapi tanpa biaya scraping infrastructure.

### 1.3 Marketplace Coverage (Phase 1)

- ✅ **Shopee** Indonesia (shopee.co.id)
- ✅ **TikTok Shop** Indonesia (tiktok.com/shop)
- ⏳ Tokopedia (Phase 5)
- ⏳ Lazada (Phase 5)

### 1.4 Core Differentiator

| Aspek | Tokpee / Shoptik | Kalodata / Fastmoss | **Mote LAB** |
|---|---|---|---|
| Data source | Browser scrape | Server scrape | Hybrid (browser + collective) |
| Cross-marketplace | ❌ | ⚠️ Terbatas | ✅ Shopee + TikTok |
| Trending lintas user | ❌ | ✅ | ✅ |
| Resiko diblokir | Rendah | Tinggi | Rendah |
| Harga (target) | Rp 50-100rb/bln | Rp 500rb+/bln | Rp 99-199rb/bln |
| Server cost | Sangat murah | Sangat mahal | Murah |

---

## 2. BUSINESS MODEL & PRICING

### 2.1 Pricing Tier

| Plan | Harga | Limit |
|---|---|---|
| **Free Trial** | Rp 0 (7 hari) | Full access, 100 produk research/hari |
| **Starter** | Rp 99.000/bln | 1 marketplace, 500 research/hari, 30 hari history |
| **Pro** | Rp 199.000/bln | All marketplace, unlimited research, 90 hari history, alert kompetitor |
| **Lifetime** | Rp 1.999.000 sekali | Pro features, lifetime |

> Lifetime tier penting untuk **early adopter** di awal launch — bisa generate cash flow cepat untuk biayai development phase berikutnya.

### 2.2 Payment Gateway

- **Xendit** (sama seperti Mote Blaster) — VA, e-wallet, QRIS, kartu kredit

### 2.3 Free Trial Mechanism

- Login dengan Google → otomatis dapat 7 hari trial
- Tidak perlu masukkan kartu kredit
- H-2 sebelum trial habis → email + in-app banner reminder
- Setelah trial habis → dashboard read-only, extension stop scrape, hanya bisa upgrade

---

## 3. TECH STACK & JUSTIFIKASI

### 3.1 Backend + Frontend Web App

| Tool | Versi | Alasan |
|---|---|---|
| Next.js | 15 (App Router) | Konsisten dengan Mote Blaster, SSR + API route dalam 1 service = hemat resource |
| TypeScript | 5.x | Type safety mutlak untuk data marketplace yang struktur-nya kompleks |
| Drizzle ORM | latest | Lightweight, type-safe, migration sederhana |
| PostgreSQL | 16 | Mature, support partition table (penting untuk data yang grow cepat) |
| Redis | 7 | Cache + queue + rate limiting |
| better-auth | latest | Sudah familiar dari Mote Blaster |
| BullMQ | latest | Queue untuk background processing data dari extension |
| TailwindCSS | 4 | Konsisten |
| shadcn/ui | latest | Konsisten |
| Recharts | latest | Chart untuk data visualization |

### 3.2 Chrome Extension

| Tool | Versi | Alasan |
|---|---|---|
| **Plasmo Framework** | latest | Modern Chrome extension framework, React-based, hot reload, share types dengan Next.js |
| TypeScript | 5.x | Sama dengan web app |
| TailwindCSS | 4 | Consistent UI |
| Zod | latest | Validate data sebelum push ke server |

### 3.3 Yang TIDAK Kita Pakai (Sengaja)

- ❌ **Puppeteer / Playwright di server** — kita tidak scrape dari server, jadi tidak butuh
- ❌ **Rotating proxy service** — tidak perlu, browser user yang scrape
- ❌ **MongoDB** — overkill, PostgreSQL lebih efisien untuk relational data marketplace
- ❌ **GraphQL** — REST sudah cukup, lebih simple maintain
- ❌ **Microservices** — monolith Next.js sudah cukup untuk skala awal sampai 10rb user
- ❌ **Docker Compose lokal** — Easypanel handle semua, cukup `npm run dev` di local

---

## 4. SYSTEM ARCHITECTURE

### 4.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER'S BROWSER                            │
│                                                                 │
│  ┌──────────────────┐         ┌─────────────────────────────┐   │
│  │   shopee.co.id   │  ◄────  │  Mote LAB Extension          │   │
│  │   tiktok.com/    │         │  - Content Script (scrape)  │   │
│  │   shop           │         │  - UI Overlay (insights)    │   │
│  └──────────────────┘         │  - Background (push to API) │   │
│                                └─────────────────────────────┘   │
└────────────────────────────────────────────┬────────────────────┘
                                             │ HTTPS POST
                                             │ (data scraped)
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EASYPANEL VPS (existing)                     │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────┐               │
│  │  mote-lab-app        │    │  mote-lab-db     │               │
│  │  Next.js 15          │    │  PostgreSQL 16   │               │
│  │  - API routes        │◄──►│  - users         │               │
│  │  - Dashboard SSR     │    │  - products      │               │
│  │  - better-auth       │    │  - shops         │               │
│  │  - Landing page      │    │  - snapshots     │               │
│  └──────────┬───────────┘    └──────────────────┘               │
│             │                                                   │
│             │ ┌──────────────────┐                              │
│             ├►│  mote-lab-redis  │                              │
│             │ │  - Cache         │                              │
│             │ │  - BullMQ queue  │                              │
│             │ │  - Rate limit    │                              │
│             │ └──────────────────┘                              │
│             │                                                   │
│             │ ┌──────────────────────┐                          │
│             └►│  mote-lab-worker     │ (Phase 4, optional now)  │
│               │  Node.js BullMQ      │                          │
│               │  - Compute trending  │                          │
│               │  - Send alerts       │                          │
│               └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Xendit     │
                    │   (payment)  │
                    └──────────────┘
```

### 4.2 Data Flow

**Flow A — User Scraping & Live Insights:**
1. User buka shopee.co.id atau tiktok.com/shop
2. Extension content script detect URL pattern → activate scraper
3. Extract data dari DOM (produk, harga, sold, rating, dll) — dengan **debounce + throttle** biar tidak overload browser
4. Tampilkan **overlay UI** ke user dengan insights instant (estimasi omset, growth, dll)
5. Background script POST data ke `/api/ingest/{marketplace}`
6. Server validasi (auth + rate limit + schema) → simpan ke staging table
7. BullMQ job process: dedupe, normalize, masuk ke main table
8. Trigger snapshot: simpan time-series data untuk historical analysis

**Flow B — User Lihat Dashboard:**
1. User login ke `lab.motekreatif.com` → dashboard
2. Lihat history riset, saved products, trending, kompetitor tracker
3. Server query PostgreSQL dengan optimized indexes
4. Render via Next.js SSR → fast load

### 4.3 Service di Easypanel

| Service Name | Type | Image | Port | RAM | Disk |
|---|---|---|---|---|---|
| `mote-lab-app` | App | Next.js (from GitHub) | 3003 | 1-2 GB | ~500 MB |
| `mote-lab-db` | DB | postgres:16-alpine | 5432 | 2-4 GB | 5-20 GB |
| `mote-lab-redis` | DB | redis:7-alpine | 6379 | 512 MB - 1 GB | ~100 MB |
| `mote-lab-worker` | App | Same repo, different start cmd | - | 1-2 GB | ~500 MB |

**Total estimasi: 5-9 GB RAM, ~25 GB disk** — masih sangat aman di server kamu (23 GB RAM, 145 GB disk).

> **Phase 0-1 cukup deploy `mote-lab-app`, `mote-lab-db`, `mote-lab-redis`** dulu. `mote-lab-worker` baru perlu di Phase 4.

---

## 5. PHASE 0 — FOUNDATION

**Estimasi: 1-2 minggu**
**Goal:** Web app jalan di production, user bisa register/login, ada landing page, billing structure ready (belum perlu integrate Xendit beneran, mock dulu).

### 5.1 Scope Phase 0

#### A. Setup Project
- [ ] Init Next.js 15 + TypeScript di repo `github.com/nanansm/mote-lab`
- [ ] Setup Drizzle ORM + PostgreSQL connection
- [ ] Setup Redis connection (untuk cache)
- [ ] Setup TailwindCSS 4 + shadcn/ui
- [ ] Setup ESLint + Prettier
- [ ] `.env.example` lengkap

#### B. Authentication
- [ ] Setup better-auth dengan:
  - Google OAuth (untuk user)
  - Email + password (untuk owner — single account)
- [ ] Schema: `users`, `sessions`, `accounts`
- [ ] Middleware untuk protected routes
- [ ] Owner role detection (by email match dengan env `OWNER_EMAIL`)

#### C. Landing Page (`/`)
Sesuai memory kamu: harus mobile-first, lightweight, SEO-friendly. Section:
1. Hero: "Riset Produk Marketplace dengan Data, Bukan Feeling"
2. Problem statement (3 pain points seller mid-tier)
3. Solution: Mote LAB hybrid architecture (visual diagram)
4. Features showcase (Shopee + TikTok Shop)
5. Pricing table (4 tier)
6. FAQ (10 pertanyaan umum)
7. Footer dengan: Privacy Policy, Terms, Disclaimer

#### D. Auth Pages
- `/login` — Google sign-in button + email/password (owner only)
- `/register` — auto-redirect ke Google OAuth
- `/onboarding` — first-time user: tutorial install extension

#### E. Dashboard Skeleton (`/dashboard`)
Belum ada data scraping, cuma layout:
- Sidebar: Dashboard, Riset Produk, Riset Toko, Saved, Settings, Billing
- Topbar: notification, profile menu
- Empty states: "Install extension dulu untuk mulai riset"

#### F. Billing Page (`/dashboard/billing`)
- Tampilkan current plan
- Tombol upgrade ke setiap tier
- Integration Xendit MOCK (button hanya log "akan integrate Xendit di Phase 2")
- `subscriptions` table sudah disiapkan

#### G. Owner Panel (`/owner`)
Mirror dari Mote Blaster:
- Total user
- Active subscription
- Revenue (mock data dulu)
- Latest registrations

### 5.2 Database Schema Phase 0

```sql
-- users table (managed by better-auth)
users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  image text,
  email_verified boolean DEFAULT false,
  role text DEFAULT 'user', -- 'user' | 'owner'
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- subscriptions
subscriptions (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  plan text NOT NULL, -- 'trial' | 'starter' | 'pro' | 'lifetime'
  status text NOT NULL, -- 'active' | 'expired' | 'cancelled'
  trial_ends_at timestamp,
  current_period_end timestamp,
  xendit_invoice_id text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- usage_quota (untuk track pemakaian harian)
usage_quota (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  research_count integer DEFAULT 0,
  UNIQUE(user_id, date)
)
```

### 5.3 Definition of Done Phase 0

- [ ] `lab.motekreatif.com` (atau subdomain pilihan) live di Easypanel
- [ ] User bisa register via Google → langsung dapat 7 hari trial
- [ ] Owner bisa login via email/password → akses `/owner`
- [ ] Landing page mobile-friendly, lighthouse score > 90
- [ ] Database schema migrated, Drizzle Studio bisa connect
- [ ] Health check endpoint `/api/health` OK
- [ ] HTTPS working dengan custom domain

---

## 6. PHASE 1 — EXTENSION MVP SHOPEE + TIKTOK SHOP

**Estimasi: 3-4 minggu**
**Goal:** Extension Plasmo yang bisa scrape Shopee + TikTok Shop, tampilkan overlay basic insights, push data ke server. Server simpan raw data (belum perlu compute trending).

### 6.1 Scope Phase 1

#### A. Setup Plasmo Project
- [ ] Init Plasmo project di repo terpisah: `github.com/nanansm/mote-lab-extension`
- [ ] Atau monorepo: `github.com/nanansm/mote-lab` dengan folder `apps/web` + `apps/extension` (rekomendasi: monorepo dengan Turborepo)
- [ ] Setup TailwindCSS untuk overlay UI
- [ ] Setup shared types antara web & extension (folder `packages/shared`)

#### B. Extension Authentication
- [ ] User login via popup extension → opens `lab.motekreatif.com/auth/extension`
- [ ] Web app generate API token → kirim balik ke extension via `chrome.storage`
- [ ] Setiap API request dari extension include token di header `Authorization: Bearer {token}`

#### C. Shopee Scrapers

**Halaman yang di-scrape (Phase 1):**

| URL Pattern | Yang Di-extract |
|---|---|
| `shopee.co.id/search?keyword=*` | List produk (nama, harga, sold, rating, link, gambar, lokasi seller) |
| `shopee.co.id/{shopname}` | Info toko (nama, follower, rating, total produk, join date) |
| `shopee.co.id/{shopname}/product/{id}/{id}` | Detail produk (full info + variants + spec) |
| `shopee.co.id/cari/{keyword}` | Sama dengan search |

**Data point per produk:**
- Product ID, name, slug, URL
- Price (current + original)
- Stock available
- Sold count (total)
- Rating (rata-rata + jumlah review)
- Shop ID, shop name
- Category ID, category name
- Image URLs (max 5)
- Location (kota/provinsi seller)
- Scraped at (timestamp)

#### D. TikTok Shop Scrapers

**Halaman yang di-scrape:**

| URL Pattern | Yang Di-extract |
|---|---|
| `tiktok.com/shop/c/*` | List produk per kategori |
| `tiktok.com/shop/pdp/*` | Detail produk |
| `tiktok.com/@{username}` (shop tab) | Toko & produknya |

**Data point per produk:**
- Product ID, name, URL
- Price (current + before discount)
- Sold count
- Rating
- Shop name, shop ID
- Affiliate commission rate (jika ada)
- Video review count
- Image/video URLs

#### E. Overlay UI Components

Inject ke marketplace page menggunakan Shadow DOM (biar style tidak conflict):

1. **Floating Action Button (FAB)** — kanan bawah, klik untuk show/hide panel
2. **Side Panel** — slide dari kanan, isi:
   - Tab "Riset Produk" (search results enhancement)
   - Tab "Riset Toko" (shop deep-dive)
   - Tab "Bandingkan" (compare 2-5 produk)
3. **Inline Badges** — di setiap produk kartu, tampilkan:
   - Estimasi omset bulan ini (sold × harga ÷ umur produk)
   - Growth indicator (▲ ▼ ━)
   - "Hot" badge kalau growth > 50% bulan ini

#### F. Server-Side Ingestion API

```
POST /api/ingest/shopee/products
POST /api/ingest/shopee/shop
POST /api/ingest/tiktok/products
POST /api/ingest/tiktok/shop
```

**Request body:**
```json
{
  "scraped_at": "2026-04-23T10:00:00Z",
  "page_url": "https://shopee.co.id/search?keyword=tas+wanita",
  "marketplace": "shopee",
  "data": [
    { /* product object */ },
    { /* product object */ }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "ingested": 60,
  "duplicates": 12,
  "errors": []
}
```

**Server processing:**
1. Validate auth token + check user quota
2. Validate schema with Zod
3. Insert ke staging table `ingest_queue` (raw JSONB)
4. Return success ke extension (cepat, < 200ms)
5. BullMQ job pickup → dedupe + normalize → insert ke main tables
6. Update `usage_quota` count

#### G. Dashboard Updates

- `/dashboard/research/products` — list semua produk yang user pernah riset, filter & sort
- `/dashboard/research/shops` — list toko yang pernah di-research
- `/dashboard/saved` — produk/toko yang user bookmark
- `/dashboard/research/{id}` — detail page dengan history harga, growth chart

### 6.2 Database Schema Phase 1 (Tambahan)

```sql
-- Marketplace produk (master)
products (
  id text PRIMARY KEY, -- format: "{marketplace}_{product_id}" e.g. "shopee_12345"
  marketplace text NOT NULL, -- 'shopee' | 'tiktok'
  external_id text NOT NULL,
  name text NOT NULL,
  slug text,
  url text NOT NULL,
  shop_id text,
  category_id text,
  category_name text,
  image_url text,
  current_price integer, -- in IDR (cents avoided, pakai rupiah utuh)
  original_price integer,
  total_sold integer,
  rating decimal(3,2),
  review_count integer,
  location text,
  first_seen_at timestamp DEFAULT now(),
  last_seen_at timestamp DEFAULT now(),
  UNIQUE(marketplace, external_id)
);

CREATE INDEX idx_products_marketplace_sold ON products(marketplace, total_sold DESC);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_shop ON products(shop_id);

-- Snapshots (time-series untuk growth tracking)
-- PARTITIONED by month
product_snapshots (
  id bigserial PRIMARY KEY,
  product_id text NOT NULL,
  snapshot_date date NOT NULL,
  price integer,
  sold_count integer,
  rating decimal(3,2),
  review_count integer,
  created_at timestamp DEFAULT now()
) PARTITION BY RANGE (snapshot_date);

CREATE INDEX idx_snapshots_product_date ON product_snapshots(product_id, snapshot_date DESC);

-- Toko (shops)
shops (
  id text PRIMARY KEY, -- "{marketplace}_{shop_id}"
  marketplace text NOT NULL,
  external_id text NOT NULL,
  name text NOT NULL,
  username text,
  url text,
  follower_count integer,
  rating decimal(3,2),
  total_products integer,
  joined_date date,
  location text,
  is_official boolean DEFAULT false,
  first_seen_at timestamp DEFAULT now(),
  last_seen_at timestamp DEFAULT now(),
  UNIQUE(marketplace, external_id)
);

-- User research history
user_research (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  product_id text REFERENCES products(id),
  shop_id text REFERENCES shops(id),
  research_type text NOT NULL, -- 'product_view' | 'shop_view' | 'search'
  metadata jsonb,
  created_at timestamp DEFAULT now()
);

CREATE INDEX idx_research_user_date ON user_research(user_id, created_at DESC);

-- Bookmarks
saved_items (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- 'product' | 'shop'
  item_id text NOT NULL,
  notes text,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Staging table untuk raw ingest
ingest_queue (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  marketplace text NOT NULL,
  data_type text NOT NULL,
  raw_data jsonb NOT NULL,
  status text DEFAULT 'pending', -- 'pending' | 'processed' | 'error'
  error_message text,
  created_at timestamp DEFAULT now(),
  processed_at timestamp
);

CREATE INDEX idx_ingest_status ON ingest_queue(status, created_at) WHERE status = 'pending';
```

### 6.3 Definition of Done Phase 1

- [ ] Extension installed dari local `.zip` (belum perlu submit ke Chrome Web Store)
- [ ] Login extension berfungsi (token-based)
- [ ] Buka shopee.co.id → overlay muncul, data ke-scrape, push ke server
- [ ] Buka tiktok.com/shop → sama
- [ ] Dashboard menampilkan history riset user
- [ ] User bisa bookmark produk
- [ ] Quota harian enforced (Free trial: 100/hari, dst)
- [ ] Tidak ada error di console (extension & server)
- [ ] Performance: overlay load < 500ms, push API response < 200ms

---

## 7. DATABASE SCHEMA (Lengkap)

Lihat section 5.2 (Phase 0) + 6.2 (Phase 1) di atas. Migration files akan dibuat dengan Drizzle Kit.

**Strategi optimasi storage (penting!):**
- `product_snapshots` PARTITIONED by month — Drizzle support via raw SQL
- Auto-archive snapshot > 90 hari ke partisi terpisah (Phase 4)
- VACUUM ANALYZE schedule via cron di Easypanel
- Index hanya yang essential — terlalu banyak index = write slow

---

## 8. API ROUTES

### 8.1 Public APIs

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | - | Health check |
| GET | `/api/pricing` | - | Get pricing tier (untuk landing) |

### 8.2 Auth APIs (better-auth)

Otomatis di-handle better-auth: `/api/auth/[...all]`

### 8.3 Extension Ingest APIs

| Method | Route | Auth | Rate Limit |
|---|---|---|---|
| POST | `/api/ingest/shopee/products` | Bearer | 60 req/min |
| POST | `/api/ingest/shopee/shop` | Bearer | 30 req/min |
| POST | `/api/ingest/tiktok/products` | Bearer | 60 req/min |
| POST | `/api/ingest/tiktok/shop` | Bearer | 30 req/min |

### 8.4 Dashboard APIs

| Method | Route | Description |
|---|---|---|
| GET | `/api/research/history` | List research history user (paginated) |
| GET | `/api/research/{id}` | Detail research (dengan snapshots) |
| GET | `/api/products/{id}` | Detail produk (dengan history) |
| GET | `/api/shops/{id}` | Detail toko |
| POST | `/api/saved` | Bookmark item |
| DELETE | `/api/saved/{id}` | Unbookmark |
| GET | `/api/saved` | List bookmark user |

### 8.5 Owner APIs

| Method | Route | Description |
|---|---|---|
| GET | `/api/owner/stats` | Total user, MRR, etc |
| GET | `/api/owner/users` | List all users |
| GET | `/api/owner/subscriptions` | List subscriptions |

---

## 9. CHROME EXTENSION SPEC

### 9.1 Manifest V3 Permissions (Minimum!)

```json
{
  "manifest_version": 3,
  "name": "Mote LAB - Marketplace Research",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://shopee.co.id/*",
    "https://tiktok.com/shop/*",
    "https://www.tiktok.com/shop/*",
    "https://lab.motekreatif.com/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://shopee.co.id/*"],
      "js": ["contents/shopee.tsx"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://*.tiktok.com/shop/*"],
      "js": ["contents/tiktok.tsx"],
      "run_at": "document_idle"
    }
  ]
}
```

**Kenapa permission minimum?** Chrome Web Store review extension dengan permission besar lebih ketat. Hindari `<all_urls>`, `tabs`, `webRequest`, dll.

### 9.2 Folder Structure (Plasmo)

```
apps/extension/
├── package.json
├── manifest.json (Plasmo auto-gen)
├── popup.tsx                    # Extension popup (login, status)
├── background.ts                # Service worker (push to API)
├── contents/
│   ├── shopee.tsx              # Content script Shopee
│   └── tiktok.tsx              # Content script TikTok
├── components/
│   ├── overlay/
│   │   ├── FAB.tsx
│   │   ├── SidePanel.tsx
│   │   └── InlineBadge.tsx
│   └── popup/
│       └── LoginButton.tsx
├── lib/
│   ├── api.ts                  # API client to motekreatif.com
│   ├── storage.ts              # chrome.storage wrapper
│   └── auth.ts
├── scrapers/
│   ├── shopee/
│   │   ├── productList.ts
│   │   ├── productDetail.ts
│   │   └── shop.ts
│   └── tiktok/
│       ├── productList.ts
│       ├── productDetail.ts
│       └── shop.ts
└── styles/
    └── overlay.css             # Tailwind compiled
```

### 9.3 Scraping Best Practices

1. **MutationObserver** untuk detect dynamic content load (Shopee + TikTok pakai infinite scroll)
2. **Debounce 500ms** sebelum scrape — hindari double-trigger
3. **Throttle push API** — max 1 request per 2 detik per user
4. **Batch data** — kumpulkan 20-50 produk sekaligus, baru push (efisien)
5. **Retry with backoff** kalau API fail (3x retry, exponential backoff)
6. **Offline queue** — kalau tidak ada koneksi, simpan di `chrome.storage`, push saat online

### 9.4 Anti-Detection (Penting!)

- ❌ JANGAN auto-click, auto-scroll, atau auto-navigate halaman → ini yang trigger marketplace anti-bot
- ✅ Scrape **hanya** dari halaman yang user buka secara natural
- ✅ Tidak inject request HTTP dari extension ke API marketplace (cuma baca DOM)
- ✅ Tidak modifikasi cookies, headers, atau user-agent
- ✅ Pure DOM reading + UI overlay only

---

## 10. UI/UX REQUIREMENTS

### 10.1 Design System

- **Font:** Inter (sama dengan Mote Blaster)
- **Primary color:** Pilih saat design — saran: deep blue (#1E40AF) atau teal (#0D9488)
- **Accent:** Orange/yellow untuk "Hot" indicator
- **Dark mode:** Phase 2 (skip dulu di Phase 0-1)

### 10.2 Mobile Responsiveness

- Landing page: WAJIB mobile-first
- Dashboard: WAJIB responsive (banyak user buka dari HP)
- Extension: Desktop only (Chrome) — tidak perlu mobile

### 10.3 Empty States

Setiap halaman dengan list/data harus punya empty state yang informatif:
- Icon
- Headline ("Belum ada riset")
- Sub-text dengan instruksi ("Install extension lalu buka shopee.co.id")
- CTA ("Download Extension" atau "Lihat Tutorial")

---

## 11. EASYPANEL DEPLOYMENT

### 11.1 Service Setup

**1. mote-lab-db (PostgreSQL)**
- Image: `postgres:16-alpine`
- Volume: 20 GB
- Memory: 4 GB
- ENV: `POSTGRES_DB=motelab`, `POSTGRES_USER=motelab`, password generated

**2. mote-lab-redis (Redis)**
- Image: `redis:7-alpine`
- Volume: 1 GB
- Memory: 1 GB

**3. mote-lab-app (Next.js)**
- Source: GitHub repo `nanansm/mote-lab` (or monorepo path `apps/web`)
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Port: 3003
- Memory: 2 GB
- Health check: `/api/health`

### 11.2 Custom Domain (WAJIB!)

Berdasarkan catatan saya: **selalu pakai custom domain, jangan pernah default Easypanel**.

- Domain plan: `lab.motekreatif.com` atau pilihan lain
- Setup di Namecheap → A record ke IP server `168.110.218.63`
- Easypanel → Domain settings → Add `lab.motekreatif.com` → enable HTTPS (Let's Encrypt auto)

### 11.3 Build Configuration

```json
// package.json scripts (web app)
{
  "scripts": {
    "dev": "next dev",
    "build": "drizzle-kit migrate && next build",
    "start": "next start -p 3003",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

> **Catatan penting:** `drizzle-kit migrate` di build = otomatis migrate saat deploy. Aman karena Drizzle pakai migration files yang tracked.

---

## 12. ENVIRONMENT VARIABLES

### 12.1 Web App (.env)

```bash
# Server
NODE_ENV=production
PORT=3003
NEXT_PUBLIC_APP_URL=https://lab.motekreatif.com

# Database
DATABASE_URL=postgres://motelab:PASSWORD@mote_mote-lab-db:5432/motelab?sslmode=disable

# Redis
REDIS_URL=redis://default:PASSWORD@mote_mote-lab-redis:6379

# better-auth
BETTER_AUTH_SECRET=<generate-32-char-random>
BETTER_AUTH_URL=https://lab.motekreatif.com

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-cloud>
GOOGLE_CLIENT_SECRET=<from-google-cloud>

# Owner account
OWNER_EMAIL=smnanan@motekreatif.com
OWNER_PASSWORD_HASH=<bcrypt-hash>

# Extension API
EXTENSION_API_RATE_LIMIT_PER_MIN=60

# Plan limits
TRIAL_DAYS=7
TRIAL_DAILY_LIMIT=100
STARTER_DAILY_LIMIT=500
PRO_DAILY_LIMIT=999999

# Xendit (Phase 2)
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=
XENDIT_STARTER_PRICE=99000
XENDIT_PRO_PRICE=199000
XENDIT_LIFETIME_PRICE=1999000
```

### 12.2 Extension (.env.development)

```bash
PLASMO_PUBLIC_API_URL=https://lab.motekreatif.com
PLASMO_PUBLIC_APP_URL=https://lab.motekreatif.com
```

---

## 13. SECURITY & ANTI-DETECTION

### 13.1 Server Security

- ✅ Rate limiting per user (BullMQ + Redis)
- ✅ Schema validation via Zod di SETIAP endpoint
- ✅ Bearer token auth untuk extension (revocable)
- ✅ SQL injection: Drizzle ORM parameterized queries (built-in)
- ✅ XSS: Next.js auto-escape, jangan pakai `dangerouslySetInnerHTML`
- ✅ CORS: hanya allow `chrome-extension://{your-id}` + `lab.motekreatif.com`
- ✅ Environment vars tidak ke-expose di client (NEXT_PUBLIC_ prefix only untuk public)

### 13.2 Extension Security

- ✅ Token disimpan di `chrome.storage.local` (encrypted oleh Chrome)
- ✅ Tidak ada `eval()` atau `Function()` constructor
- ✅ Content security policy di manifest
- ✅ Validasi data dari DOM sebelum push (kadang Shopee inject HTML weird)

### 13.3 Anti-Detection oleh Marketplace

Sudah dibahas di section 9.4 — intinya: jangan pernah trigger pattern bot-like behavior.

---

## 14. PERFORMANCE & RESOURCE OPTIMIZATION

### 14.1 Next.js Optimization

- Use App Router with `dynamic = 'force-dynamic'` HANYA untuk page dengan real-time data
- Static landing page → ISR atau full static
- Image optimization: pakai Next.js `<Image>` component
- Bundle analyzer: cek `npm run build` output, target < 200 KB initial JS

### 14.2 Database Optimization

- Index hanya yang sering di-query
- Partition `product_snapshots` by month
- Connection pooling: Drizzle default sudah pakai pg pool
- Query `EXPLAIN ANALYZE` untuk query yang slow (> 100ms)

### 14.3 Redis Optimization

- TTL semua cache (default 5 menit, max 1 jam)
- Pakai SCAN bukan KEYS (KEYS blocking)
- BullMQ: cleanup completed jobs setelah 1 jam, failed jobs setelah 7 hari

### 14.4 Extension Optimization

- Bundle size target: < 500 KB total
- Lazy load scrapers (hanya load yang relevan dengan URL current)
- DOM scrape pakai `requestIdleCallback` biar tidak block UI

---

## 15. LEGAL & COMPLIANCE

### 15.1 Terms of Service (WAJIB ada di landing)

Poin penting:
1. Mote LAB adalah **browser helper tool** yang membantu user melihat informasi yang sudah publik di marketplace
2. User bertanggung jawab atas penggunaan tool sesuai TOS marketplace masing-masing
3. Kami tidak afiliasi dengan Shopee/TikTok/Tokopedia/Lazada
4. Data yang ditampilkan adalah agregasi dari user kami sendiri, bukan akses ilegal ke API marketplace

### 15.2 Privacy Policy (WAJIB)

Poin penting:
1. Data yang kami collect: email, nama, foto profil dari Google OAuth
2. Data scraping: URL marketplace yang dibuka user, data produk yang publicly visible
3. Kami TIDAK collect: cookie marketplace, password, payment info marketplace
4. Data disimpan di server Indonesia (Easypanel VPS)
5. User bisa request data deletion kapan saja (GDPR-like)

### 15.3 Disclaimer di Landing Page

Footer wajib ada:
> "Shopee, TikTok, Tokopedia, dan Lazada adalah merek dagang dari pemiliknya masing-masing. Mote LAB tidak berafiliasi dengan platform tersebut."

### 15.4 Chrome Web Store Compliance

- Privacy policy URL wajib di-submit
- Justifikasi setiap permission yang di-request
- Tidak ada deceptive UI
- Tidak ada hidden functionality

---

## 16. IMPLEMENTATION NOTES FOR CLAUDE CODE

### 16.1 Repository Structure (Monorepo Recommended)

```
mote-lab/
├── apps/
│   ├── web/              # Next.js web app
│   └── extension/        # Plasmo extension
├── packages/
│   ├── shared/           # Shared types, validators (Zod schemas)
│   ├── db/               # Drizzle schema & migrations
│   └── ui/               # Shared UI components (optional)
├── package.json          # Workspace root
├── turbo.json            # Turborepo config
├── tsconfig.base.json
└── README.md
```

### 16.2 Build Order

1. Setup monorepo & shared packages dulu
2. Build & deploy `apps/web` (Phase 0)
3. Test deployment di Easypanel sampai stable
4. Build `apps/extension` (Phase 1)
5. Test extension lokal
6. Iterate sampai DOD Phase 1 done

### 16.3 Git Workflow (sesuai catatan)

- Develop di local dengan Claude Code
- Test lokal sampai yakin
- Push manual ke GitHub
- Easypanel auto-deploy dari main branch (atau manual deploy via UI)
- **JANGAN pernah push langsung tanpa test lokal**

### 16.4 Migrasi Database

- Setiap perubahan schema → `npm run db:generate` → buat migration file
- Commit migration file ke git
- Saat deploy, `drizzle-kit migrate` jalan otomatis di build

### 16.5 Testing Strategy

- **Phase 0:** manual test cukup (login flow, billing UI)
- **Phase 1:** unit test untuk scrapers (sample HTML → expected JSON)
- **Phase 4 onwards:** add E2E test dengan Playwright

---

## ✅ APPROVAL CHECKLIST

Sebelum mulai development:

- [ ] PRD ini sudah dibaca lengkap
- [ ] Stack & arsitektur disetujui
- [ ] Business model & pricing disetujui
- [ ] Domain `lab.motekreatif.com` (atau alternatif) sudah disiapkan di Namecheap
- [ ] Easypanel quota cukup (cek RAM/disk available)
- [ ] Google Cloud project untuk OAuth sudah ada (atau akan dibuat)

---

**Document version:** 1.0.0
**Last updated:** 23 April 2026
**Next review:** Setelah Phase 0 selesai
