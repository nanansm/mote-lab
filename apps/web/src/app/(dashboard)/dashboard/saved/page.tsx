import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookmarkIcon, ExternalLinkIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const params = await searchParams;
  const tab = params.tab === "shops" ? "shops" : "products";

  const savedItems = await db.query.savedItems.findMany({
    where: and(
      eq(schema.savedItems.userId, session.user.id),
      eq(schema.savedItems.itemType, tab === "products" ? "product" : "shop"),
    ),
    orderBy: [desc(schema.savedItems.createdAt)],
  });

  const itemIds = savedItems.map((s) => s.itemId);

  const products =
    tab === "products" && itemIds.length > 0
      ? await db.query.products.findMany({
          where: (p, { inArray }) => inArray(p.id, itemIds),
        })
      : [];

  const shops =
    tab === "shops" && itemIds.length > 0
      ? await db.query.shops.findMany({
          where: (s, { inArray }) => inArray(s.id, itemIds),
        })
      : [];

  const productMap = new Map(products.map((p) => [p.id, p]));
  const shopMap = new Map(shops.map((s) => [s.id, s]));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Saved</h1>
        <p className="text-slate-600 mt-1 text-sm">Produk dan toko yang kamu bookmark.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["products", "shops"] as const).map((t) => (
          <Link
            key={t}
            href={`/dashboard/saved?tab=${t}`}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-[#1E40AF] text-[#1E40AF]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "products" ? "Produk" : "Toko"}
          </Link>
        ))}
      </div>

      {savedItems.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BookmarkIcon className="size-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Belum Ada {tab === "products" ? "Produk" : "Toko"} Tersimpan
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Klik tombol Save di halaman detail produk atau toko.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tab === "products"
            ? savedItems.map((saved) => {
                const p = productMap.get(saved.itemId);
                if (!p) return null;
                return (
                  <Card key={saved.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/dashboard/research/products/${encodeURIComponent(p.id)}`}
                            className="font-medium text-slate-800 text-sm line-clamp-2 hover:text-[#1E40AF]"
                          >
                            {p.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize text-xs">{p.marketplace}</Badge>
                            {p.currentPrice && (
                              <span className="text-xs font-semibold text-[#1E40AF]">{formatCurrency(p.currentPrice)}</span>
                            )}
                          </div>
                        </div>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-slate-600">
                          <ExternalLinkIcon className="size-4" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            : savedItems.map((saved) => {
                const s = shopMap.get(saved.itemId);
                if (!s) return null;
                return (
                  <Card key={saved.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/dashboard/research/shops/${encodeURIComponent(s.id)}`}
                            className="font-medium text-slate-800 text-sm hover:text-[#1E40AF]"
                          >
                            {s.name}
                          </Link>
                          {s.username && <p className="text-xs text-slate-400">@{s.username}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize text-xs">{s.marketplace}</Badge>
                            {s.followerCount && (
                              <span className="text-xs text-slate-500">{s.followerCount.toLocaleString("id-ID")} followers</span>
                            )}
                          </div>
                        </div>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-slate-600">
                          <ExternalLinkIcon className="size-4" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      )}
    </div>
  );
}
