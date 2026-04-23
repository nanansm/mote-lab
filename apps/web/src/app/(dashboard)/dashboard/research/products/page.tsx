import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq, and, sql } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, ExternalLinkIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function ResearchProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ marketplace?: string; page?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const params = await searchParams;
  const marketplace = params.marketplace;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Get products this user has researched, one row per product, most-recent first
  const researchRows = await db
    .select({
      productId: schema.userResearch.productId,
    })
    .from(schema.userResearch)
    .where(
      and(
        eq(schema.userResearch.userId, session.user.id),
        eq(schema.userResearch.researchType, "product_view"),
        sql`${schema.userResearch.productId} IS NOT NULL`,
      ),
    )
    .groupBy(schema.userResearch.productId)
    .orderBy(sql`max(${schema.userResearch.createdAt}) DESC`)
    .limit(pageSize)
    .offset(offset);

  const productIds = researchRows
    .map((r) => r.productId)
    .filter(Boolean) as string[];

  const products =
    productIds.length > 0
      ? await db.query.products.findMany({
          where: (p, { inArray }) =>
            and(
              inArray(p.id, productIds),
              marketplace ? eq(p.marketplace, marketplace) : sql`1=1`,
            ),
        })
      : [];

  // Sort products by research order
  const productMap = new Map(products.map((p) => [p.id, p]));
  const sortedProducts = productIds
    .map((id) => productMap.get(id))
    .filter(Boolean) as (typeof products)[0][];

  if (sortedProducts.length === 0) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riset Produk</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Analisis performa produk dari Shopee & TikTok Shop.
          </p>
        </div>
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <SearchIcon className="size-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Data Produk</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
              Install extension Mote LAB, lalu buka Shopee atau TikTok Shop.
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
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riset Produk</h1>
          <p className="text-slate-600 mt-0.5 text-sm">
            {productIds.length} produk · halaman {page}
          </p>
        </div>
        {/* Marketplace filter */}
        <div className="flex gap-2">
          {["", "shopee", "tiktok"].map((mkt) => (
            <Button
              key={mkt}
              asChild
              size="sm"
              variant={marketplace === mkt || (!marketplace && mkt === "") ? "default" : "outline"}
              className={
                marketplace === mkt || (!marketplace && mkt === "")
                  ? "bg-[#1E40AF] hover:bg-[#1d4ed8]"
                  : ""
              }
            >
              <Link href={`/dashboard/research/products${mkt ? `?marketplace=${mkt}` : ""}`}>
                {mkt === "" ? "Semua" : mkt === "shopee" ? "Shopee" : "TikTok"}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Produk</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Platform</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Harga</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Terjual</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Rating</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedProducts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 max-w-xs">
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-md shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded-md shrink-0" />
                    )}
                    <Link
                      href={`/dashboard/research/products/${encodeURIComponent(p.id)}`}
                      className="font-medium text-slate-800 hover:text-[#1E40AF] line-clamp-2"
                    >
                      {p.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize text-xs">
                    {p.marketplace}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  {p.currentPrice ? formatCurrency(p.currentPrice) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {p.totalSold?.toLocaleString("id-ID") ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {p.rating ? `${p.rating.toFixed(1)} ★` : "—"}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-[#1E40AF]"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sortedProducts.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-14 h-14 object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-slate-100 rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/research/products/${encodeURIComponent(p.id)}`}
                    className="font-medium text-slate-800 text-sm line-clamp-2 hover:text-[#1E40AF]"
                  >
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="capitalize text-xs">
                      {p.marketplace}
                    </Badge>
                    {p.currentPrice && (
                      <span className="text-sm font-semibold text-[#1E40AF]">
                        {formatCurrency(p.currentPrice)}
                      </span>
                    )}
                    {p.totalSold !== null && (
                      <span className="text-xs text-slate-500">
                        {p.totalSold.toLocaleString("id-ID")} terjual
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {productIds.length === pageSize && (
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link
              href={`/dashboard/research/products?page=${page + 1}${marketplace ? `&marketplace=${marketplace}` : ""}`}
            >
              Halaman Berikutnya
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
