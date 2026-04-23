import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ExternalLinkIcon, BookmarkIcon } from "lucide-react";
import { formatDate, formatIDR, formatCurrency } from "@/lib/utils";

export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;
  const shopId = decodeURIComponent(id);

  const shop = await db.query.shops.findFirst({ where: eq(schema.shops.id, shopId) });
  if (!shop) notFound();

  const isSaved = await db.query.savedItems.findFirst({
    where: and(
      eq(schema.savedItems.userId, session.user.id),
      eq(schema.savedItems.itemType, "shop"),
      eq(schema.savedItems.itemId, shopId),
    ),
  });

  // Products linked via shopId = shop.externalId
  const products = await db.query.products.findMany({
    where: and(
      eq(schema.products.marketplace, shop.marketplace),
      eq(schema.products.shopId, shop.externalId),
    ),
    orderBy: [desc(schema.products.totalSold)],
    limit: 50,
  });

  const totalOmset = products.reduce(
    (sum, p) => sum + (p.currentPrice ?? 0) * (p.totalSold ?? 0),
    0,
  );
  const monthlyOmset = totalOmset / 6;
  const avgPerProduct = products.length > 0 ? monthlyOmset / products.length : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link href="/dashboard/research/shops">
          <ArrowLeftIcon className="size-4" />
          Kembali
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
          {shop.username && <p className="text-slate-500 text-sm mt-0.5">@{shop.username}</p>}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="capitalize">{shop.marketplace}</Badge>
            {shop.isOfficial && <Badge className="bg-blue-100 text-blue-700 border-blue-200">Official</Badge>}
            {shop.location && <span className="text-xs text-slate-500">{shop.location}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2">
            <BookmarkIcon className={`size-4 ${isSaved ? "fill-current text-[#1E40AF]" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href={shop.url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="size-4" />
              Buka
            </a>
          </Button>
        </div>
      </div>

      {/* Shop metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Followers", value: shop.followerCount?.toLocaleString("id-ID") ?? "—" },
          { label: "Total Produk", value: shop.totalProducts?.toLocaleString("id-ID") ?? "—" },
          { label: "Rating", value: shop.rating ? `${shop.rating.toFixed(1)} ★` : "—" },
          { label: "Bergabung", value: shop.joinedDate ? formatDate(shop.joinedDate) : "—" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Omset estimation (only shown when products are linked) */}
      {totalOmset > 0 && (
        <div className="rounded-xl border bg-[#f0f4ff] border-[#c7d7f9] p-5">
          <h2 className="text-sm font-bold text-[#1E40AF] mb-4">Estimasi Omset Toko</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Omset", value: formatIDR(totalOmset) },
              { label: "Omset / Bulan", value: formatIDR(monthlyOmset) },
              { label: "Rata-rata / Produk", value: formatIDR(avgPerProduct) },
              { label: "Produk Ter-track", value: products.length.toString() },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-xs text-slate-500 mb-0.5">{m.label}</p>
                <p className="text-base font-bold text-slate-900">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">*Estimasi: total terjual × harga, asumsi 6 bulan aktif</p>
        </div>
      )}

      {/* Product list */}
      {products.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{products.length} Produk Ter-track</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600 font-medium">
                    <th className="text-left px-4 py-2.5">Produk</th>
                    <th className="text-right px-4 py-2.5">Harga</th>
                    <th className="text-right px-4 py-2.5">Terjual</th>
                    <th className="text-right px-4 py-2.5">Est. Omset</th>
                    <th className="text-right px-4 py-2.5">Rating</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => {
                    const omset = (p.currentPrice ?? 0) * (p.totalSold ?? 0);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 max-w-[240px]">
                          <Link
                            href={`/dashboard/research/products/${encodeURIComponent(p.id)}`}
                            className="text-slate-800 hover:text-[#1E40AF] line-clamp-2 text-xs"
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700 whitespace-nowrap">
                          {p.currentPrice ? formatCurrency(p.currentPrice) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600">
                          {p.totalSold?.toLocaleString("id-ID") ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-[#1E40AF] whitespace-nowrap">
                          {omset > 0 ? formatIDR(omset) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600">
                          {p.rating ? `${p.rating.toFixed(1)} ★` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1E40AF]">
                            <ExternalLinkIcon className="size-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-slate-500 text-sm">
            Belum ada produk ter-track untuk toko ini. Buka halaman toko di Shopee atau Tokopedia dan klik FAB Mote LAB.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detail Toko</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["ID Eksternal", shop.externalId],
              ["Pertama Dilihat", formatDate(shop.firstSeenAt)],
              ["Terakhir Update", formatDate(shop.lastSeenAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-800">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
