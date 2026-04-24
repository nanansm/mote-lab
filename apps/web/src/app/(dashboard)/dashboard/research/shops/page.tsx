import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreIcon, ExternalLinkIcon } from "lucide-react";
import { formatIDR } from "@/lib/utils";

function fmt(n: number | null | undefined) {
  if (!n) return "—";
  return n.toLocaleString("id-ID");
}

export default async function ResearchShopsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const researchRows = await db
    .select({ shopId: schema.userResearch.shopId })
    .from(schema.userResearch)
    .where(
      and(
        eq(schema.userResearch.userId, session.user.id),
        eq(schema.userResearch.researchType, "shop_view"),
        sql`${schema.userResearch.shopId} IS NOT NULL`,
      ),
    )
    .groupBy(schema.userResearch.shopId)
    .orderBy(sql`max(${schema.userResearch.createdAt}) DESC`);

  const shopIds = researchRows.map((r) => r.shopId).filter(Boolean) as string[];

  const shops =
    shopIds.length > 0
      ? await db.query.shops.findMany({ where: (s, { inArray }) => inArray(s.id, shopIds) })
      : [];

  // Aggregate omset + sold + product count per shop via products.shopId = shops.externalId
  const shopExternalIds = shops.map((s) => s.externalId).filter(Boolean);
  const omsetRows =
    shopExternalIds.length > 0
      ? await db
          .select({
            shopExternalId: schema.products.shopId,
            marketplace: schema.products.marketplace,
            totalOmset: sql<number>`COALESCE(SUM(${schema.products.currentPrice}::bigint * ${schema.products.totalSold}::bigint), 0)`,
            totalSoldSum: sql<number>`COALESCE(SUM(${schema.products.totalSold}::bigint), 0)`,
            productCount: sql<number>`COUNT(*)::int`,
          })
          .from(schema.products)
          .where(
            and(
              sql`${schema.products.shopId} IS NOT NULL`,
              inArray(schema.products.shopId, shopExternalIds),
            ),
          )
          .groupBy(schema.products.shopId, schema.products.marketplace)
      : [];

  const omsetMap = new Map(
    omsetRows.map((r) => [`${r.marketplace}__${r.shopExternalId}`, r]),
  );

  const summaryTotalOmset = omsetRows.reduce((s, r) => s + Number(r.totalOmset), 0);
  const summaryMonthly = summaryTotalOmset / 6;

  if (shops.length === 0) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riset Toko</h1>
          <p className="text-slate-600 mt-1 text-sm">Track performa toko pesaing.</p>
        </div>
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <StoreIcon className="size-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Data Toko</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              Buka halaman toko di Shopee atau Tokopedia saat extension aktif.
            </p>
            <Button asChild className="bg-[#1E40AF] hover:bg-[#1d4ed8]">
              <Link href="/dashboard/install-extension">Install Extension</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Riset Toko</h1>
        <p className="text-slate-600 mt-0.5 text-sm">{shops.length} toko ter-track</p>
      </div>

      {/* Summary cards */}
      {summaryTotalOmset > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Omset", value: formatIDR(summaryTotalOmset) },
            { label: "Est. Omset / Bulan", value: formatIDR(summaryMonthly) },
            { label: "Toko Tracked", value: shops.length.toString() },
            {
              label: "Total Produk",
              value: omsetRows.reduce((s, r) => s + Number(r.productCount), 0).toLocaleString("id-ID"),
            },
          ].map((m) => (
            <Card key={m.label} className="bg-slate-50 border-slate-200">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                <p className="text-lg font-bold text-slate-900">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Toko</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Platform</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">
                <span className="block text-[10px] text-slate-400">Shopee: Pengikut</span>
                <span className="block text-[10px] text-slate-400">Tokopedia: Ulasan</span>
              </th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Produk</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Total Terjual</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Rating</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Est. Omset/Bln</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shops.map((s) => {
              const omset = omsetMap.get(`${s.marketplace}__${s.externalId}`);
              const monthly = omset ? Number(omset.totalOmset) / 6 : null;
              const isTokopedia = s.marketplace === "tokopedia";

              // Followers / Ulasan
              const audienceStat = isTokopedia
                ? fmt(s.reviewCount)
                : fmt(s.followerCount);

              // Product count: Tokopedia → from scraped products; Shopee → from shop record
              const productCount = isTokopedia
                ? (omset ? Number(omset.productCount) : null)
                : s.totalProducts;

              // Total sold: Tokopedia → shop.totalSold (from header); Shopee → sum of products
              const totalSold = isTokopedia
                ? (s.totalSold > 0 ? s.totalSold : null)
                : (omset ? Number(omset.totalSoldSum) : null);

              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/research/shops/${encodeURIComponent(s.id)}`}
                      className="font-medium text-slate-800 hover:text-[#1E40AF]"
                    >
                      {s.name}
                    </Link>
                    {s.username && <p className="text-xs text-slate-400">@{s.username}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`capitalize text-xs ${isTokopedia ? "border-green-300 text-green-700" : "border-orange-300 text-orange-700"}`}
                    >
                      {s.marketplace}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{audienceStat}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fmt(productCount)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fmt(totalSold)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {s.rating ? `${s.rating.toFixed(1)} ★` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#1E40AF]">
                    {monthly !== null ? formatIDR(monthly) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1E40AF]">
                      <ExternalLinkIcon className="size-4" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {shops.map((s) => {
          const omset = omsetMap.get(`${s.marketplace}__${s.externalId}`);
          const monthly = omset ? Number(omset.totalOmset) / 6 : null;
          const isTokopedia = s.marketplace === "tokopedia";
          const totalSold = isTokopedia
            ? (s.totalSold > 0 ? s.totalSold : null)
            : (omset ? Number(omset.totalSoldSum) : null);

          return (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/research/shops/${encodeURIComponent(s.id)}`}
                    className="font-medium text-slate-800 hover:text-[#1E40AF] text-sm"
                  >
                    {s.name}
                  </Link>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 shrink-0">
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs ${isTokopedia ? "border-green-300 text-green-700" : "border-orange-300 text-orange-700"}`}
                  >
                    {s.marketplace}
                  </Badge>
                  {isTokopedia
                    ? s.reviewCount > 0 && <span className="text-xs text-slate-500">{fmt(s.reviewCount)} ulasan</span>
                    : s.followerCount && <span className="text-xs text-slate-500">{fmt(s.followerCount)} pengikut</span>
                  }
                  {totalSold && <span className="text-xs text-slate-500">{fmt(totalSold)} terjual</span>}
                  {s.rating && <span className="text-xs text-slate-500">{s.rating.toFixed(1)} ★</span>}
                </div>
                {monthly !== null && (
                  <p className="text-sm font-semibold text-[#1E40AF] mt-2">
                    Est. {formatIDR(monthly)} / bln
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">*Estimasi omset = total terjual × harga, asumsi 6 bulan aktif</p>
    </div>
  );
}
