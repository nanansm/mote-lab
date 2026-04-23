# Mote LAB

Marketplace research tool berbasis hybrid architecture untuk Shopee & TikTok Shop Indonesia.

**Stack:** Next.js 15 · Drizzle ORM · better-auth · PostgreSQL 16 · Redis 7 · TailwindCSS 4 · shadcn/ui · Turborepo

---

## Prerequisites

- Node.js 22+
- PostgreSQL 16
- Redis 7
- npm 10+

---

## Local Development Setup

### 1. Clone & install

```bash
git clone https://github.com/nanansm/mote-lab.git
cd mote-lab
npm install --legacy-peer-deps
```

### 2. Environment variables

```bash
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local dengan nilai yang benar
```

Minimal yang harus diisi:
- `DATABASE_URL` — koneksi ke PostgreSQL lokal
- `REDIS_URL` — koneksi ke Redis lokal
- `BETTER_AUTH_SECRET` — generate: `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- `OWNER_EMAIL` + `OWNER_PASSWORD_HASH`

### 3. Generate password hash untuk owner

```bash
node scripts/hash-password.js "passwordmu"
# Copy output ke OWNER_PASSWORD_HASH di .env.local
```

### 4. Database migration

```bash
npm run db:generate   # Generate migration files (sudah ada di repo)
npm run db:migrate    # Apply migrations ke DB
```

### 5. Seed owner account

```bash
OWNER_EMAIL=kamu@email.com OWNER_PASSWORD=passwordmu npx tsx scripts/seed-owner.ts
```

### 6. Run dev server

```bash
npm run dev
# Web: http://localhost:3003
```

---

## Project Structure

```
mote-lab/
├── apps/
│   └── web/              # Next.js 15 web app
├── packages/
│   ├── db/               # Drizzle ORM schema & client
│   └── shared/           # Shared types & Zod schemas
├── scripts/
│   ├── hash-password.js  # Generate bcrypt hash untuk OWNER_PASSWORD_HASH
│   └── seed-owner.ts     # Create/update owner account
├── Dockerfile
└── turbo.json
```

---

## Available Scripts

| Script | Deskripsi |
|---|---|
| `npm run dev` | Start dev server (all apps) |
| `npm run build` | Build semua packages & apps |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Buka Drizzle Studio |
| `npm run lint` | Lint semua code |
| `npm run format` | Format semua files |

---

## Deployment ke Easypanel

### Services yang dibuat di Easypanel:

1. **mote-lab-db** — PostgreSQL 16, 4 GB RAM, 20 GB disk
2. **mote-lab-redis** — Redis 7, 1 GB RAM
3. **mote-lab-app** — Next.js app dari GitHub

### Urutan deploy:

1. Buat `mote-lab-db` dan `mote-lab-redis` di Easypanel
2. Push code ke `github.com/nanansm/mote-lab`
3. Buat `mote-lab-app` di Easypanel:
   - Source: GitHub `nanansm/mote-lab`
   - Build: Dockerfile
   - Port: 3003
   - Memory: 2 GB
4. Set semua env vars (sesuai `.env.example`)
5. Deploy → cek logs → test `/api/health`
6. Setup custom domain `lab.motekreatif.com`
7. A record di Namecheap → IP `168.110.218.63`
8. Enable HTTPS (Let's Encrypt) di Easypanel

### Database connection string (Easypanel internal):
```
DATABASE_URL=postgres://motelab:PASSWORD@mote_mote-lab-db:5432/motelab?sslmode=disable
REDIS_URL=redis://default:PASSWORD@mote_mote-lab-redis:6379
```

---

## Internal Owner Access

> **Jangan share URL ini ke publik.**

Owner panel login: `/control-panel/login`

- URL ini tidak ter-link dari mana pun di public UI
- Set env vars: `OWNER_EMAIL` + `OWNER_PASSWORD` (plain text, tidak di-hash)
- Rate limit: 5 attempt per 15 menit per IP
- `/owner/*` hanya accessible setelah login owner berhasil

**Setup owner account (sekali saja, atau saat user record tidak ada):**
```bash
DATABASE_URL=... OWNER_EMAIL=... node scripts/seed-owner.mjs
```

**Ganti password:** Cukup update `OWNER_PASSWORD` di Easypanel env → redeploy. Tidak perlu hash.

---

## Google OAuth Setup

1. Buka Google Cloud Console → project Mote Blaster yang existing
2. APIs & Services → Credentials → OAuth 2.0 Client
3. Tambahkan Authorized redirect URI:
   ```
   https://lab.motekreatif.com/api/auth/callback/google
   http://localhost:3003/api/auth/callback/google  (untuk dev)
   ```
4. Copy Client ID & Secret ke env

---

## Phase Roadmap

- **Phase 0** ✅ — Web app, auth, dashboard skeleton, owner panel
- **Phase 1** — Chrome extension (Plasmo), Shopee & TikTok Shop scraping
- **Phase 2** — Payment integration (iPaymu), email notifications
- **Phase 3** — Advanced analytics, competitor tracking
- **Phase 4** — Background workers, trending computation
- **Phase 5** — Tokopedia & Lazada support

---

## Contact

**Mote Kreatif** · motekreatif@gmail.com
