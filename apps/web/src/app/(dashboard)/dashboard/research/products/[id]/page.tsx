import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ExternalLinkIcon, BookmarkIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;
  const productId = decodeURIComponent(id);

  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, productId),
  });

  if (!product) notFound();

  const snapshots = await db.query.productSnapshots.findMany({
    where: eq(schema.productSnapshots.productId, productId),
    orderBy: (s, { asc }) => [asc(s.snapshotDate)],
    limit: 30,
  });

  const isSaved = await db.query.savedItems.findFirst({
    where: (s, { and, eq }) =>
      and(
        eq(s.userId, session.user.id),
        eq(s.itemType, "product"),
        eq(s.itemId, productId),
      ),
  });

  // Build SVG sparkline for sold count history
  function buildSparkline(data: number[], width = 200, height = 40): string {
    if (data.length < 2) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const xStep = width / (data.length - 1);
    const points = data
      .map(
        (v, i) =>
          `${(i * xStep).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`,
      )
      .join(" ");
    return points;
  }

  const soldData = snapshots.map((s) => s.soldCount ?? 0);
  const priceData = snapshots.map((s) => s.price ?? 0).filter((p) => p > 0);
  const soldSparkline = buildSparkline(soldData);
  const priceSparkline = buildSparkline(priceData);

  const estimatedRevenue =
    product.currentPrice && product.totalSold
      ? product.currentPrice * product.totalSold
      : null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link href="/dashboard/research/products">
          <ArrowLeftIcon className="size-4" />
          Kembali
        </Link>
      </Button>

      {/* Product header */}
      <div className="flex items-start gap-4">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl shrink-0"
          />
        ) : (
          <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-100 rounded-xl shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{product.name}</h1>
            <div className="flex gap-2 shrink-0">
              <form action={`/api/saved/${productId}`} method="post">
                <Button variant="outline" size="sm" className="gap-2">
                  <BookmarkIcon className={`size-4 ${isSaved ? "fill-current text-[#1E40AF]" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
              </form>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={product.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="size-4" />
                  Buka
                </a>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="capitalize">{product.marketplace}</Badge>
            {product.categoryName && (
              <Badge variant="secondary">{product.categoryName}</Badge>
            )}
            {product.location && (
              <span className="text-xs text-slate-500">{product.location}</span>
            )}
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Harga", value: product.currentPrice ? formatCurrency(product.currentPrice) : "—" },
          { label: "Total Terjual", value: product.totalSold?.toLocaleString("id-ID") ?? "—" },
          { label: "Rating", value: product.rating ? `${product.rating.toFixed(1)} ★` : "—" },
          {
            label: "Est. Revenue",
            value: estimatedRevenue ? formatCurrency(estimatedRevenue) : "—",
            highlight: true,
          },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className={`text-lg font-bold mt-1 ${m.highlight ? "text-[#1E40AF]" : "text-slate-900"}`}>
                {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* History charts */}
      {snapshots.length > 1 && (
        <div className="grid md:grid-cols-2 gap-4">
          {soldData.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Riwayat Penjualan</CardTitle>
              </CardHeader>
              <CardContent>
                <svg viewBox="0 0 200 50" className="w-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="soldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#1E40AF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points={soldSparkline}
                    fill="none"
                    stroke="#1E40AF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{snapshots[0]?.snapshotDate}</span>
                  <span>{snapshots[snapshots.length - 1]?.snapshotDate}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {priceData.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Riwayat Harga</CardTitle>
              </CardHeader>
              <CardContent>
                <svg viewBox="0 0 200 50" className="w-full" xmlns="http://www.w3.org/2000/svg">
                  <polyline
                    points={priceSparkline}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{snapshots[0]?.snapshotDate}</span>
                  <span>{snapshots[snapshots.length - 1]?.snapshotDate}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["ID Produk", product.externalId],
              ["Toko ID", product.shopId ?? "—"],
              ["Kategori", product.categoryName ?? "—"],
              ["Lokasi", product.location ?? "—"],
              ["Pertama Dilihat", formatDate(product.firstSeenAt)],
              ["Terakhir Update", formatDate(product.lastSeenAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
