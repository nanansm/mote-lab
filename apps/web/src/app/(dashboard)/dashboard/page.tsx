import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  StoreIcon,
  BookmarkIcon,
  DownloadIcon,
  ClockIcon,
  PuzzleIcon,
} from "lucide-react";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { PLAN_LABELS } from "@mote-lab/shared";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const userId = session.user.id;

  // Parallel queries
  const [subscription, productCount, shopCount, savedCount, recentResearch] =
    await Promise.all([
      db.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.userId, userId),
        orderBy: [desc(schema.subscriptions.createdAt)],
      }),
      db
        .select({ count: count() })
        .from(schema.userResearch)
        .where(
          and(
            eq(schema.userResearch.userId, userId),
            eq(schema.userResearch.researchType, "product_view"),
          ),
        )
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(schema.userResearch)
        .where(
          and(
            eq(schema.userResearch.userId, userId),
            eq(schema.userResearch.researchType, "shop_view"),
          ),
        )
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(schema.savedItems)
        .where(eq(schema.savedItems.userId, userId))
        .then((r) => r[0]?.count ?? 0),
      db.query.userResearch.findMany({
        where: eq(schema.userResearch.userId, userId),
        orderBy: [desc(schema.userResearch.createdAt)],
        limit: 5,
      }),
    ]);

  const plan = subscription?.plan ?? "trial";
  const isTrialExpired =
    plan === "trial" &&
    subscription?.trialEndsAt &&
    new Date(subscription.trialEndsAt) < new Date();

  const quickStats = [
    { label: "Riset Produk", value: String(productCount), icon: SearchIcon, href: "/dashboard/research/products" },
    { label: "Riset Toko", value: String(shopCount), icon: StoreIcon, href: "/dashboard/research/shops" },
    { label: "Tersimpan", value: String(savedCount), icon: BookmarkIcon, href: "/dashboard/saved" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Halo, {session.user.name?.split(" ")[0] ?? "Seller"} 👋
        </h1>
        <p className="text-slate-600 mt-1 text-sm">Selamat datang di Mote LAB Dashboard.</p>
      </div>

      {/* Trial expired banner */}
      {isTrialExpired && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold text-red-800 text-sm">Trial kamu sudah berakhir</div>
            <div className="text-red-700 text-xs mt-0.5">
              Upgrade untuk melanjutkan akses ke semua fitur.
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0 bg-red-600 hover:bg-red-700">
            <Link href="/dashboard/billing">Upgrade Sekarang</Link>
          </Button>
        </div>
      )}

      {/* Trial active banner */}
      {!isTrialExpired && plan === "trial" && subscription?.trialEndsAt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="size-5 text-blue-600 shrink-0" />
            <div>
              <div className="font-semibold text-blue-800 text-sm">
                Trial aktif · Berakhir {formatRelativeDate(subscription.trialEndsAt)}
              </div>
              <div className="text-blue-700 text-xs mt-0.5">
                {formatDate(subscription.trialEndsAt)}
              </div>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 shrink-0">
            {PLAN_LABELS[plan as keyof typeof PLAN_LABELS]}
          </Badge>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {quickStats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer py-5">
              <CardHeader className="pb-2 pt-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="size-4 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Extension CTA or recent activity */}
      {recentResearch.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-white">
          <CardContent className="py-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <PuzzleIcon className="size-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Install Extension untuk Mulai Riset
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
              Extension Chrome Mote LAB akan otomatis mengumpulkan data produk saat kamu browse
              Shopee atau Tokopedia.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="gap-2 bg-[#1E40AF] hover:bg-[#1d4ed8]">
                <Link href="/dashboard/install-extension">
                  <DownloadIcon className="size-4" />
                  Install Extension
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/billing">Lihat Plan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aktivitas Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentResearch.map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {r.researchType === "product_view" ? (
                      <SearchIcon className="size-4 text-slate-400 shrink-0" />
                    ) : (
                      <StoreIcon className="size-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-sm text-slate-700 truncate">
                      {r.productId ?? r.shopId ?? "—"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {formatRelativeDate(r.createdAt)}
                  </span>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href="/dashboard/research/products">Lihat Semua Riset</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
