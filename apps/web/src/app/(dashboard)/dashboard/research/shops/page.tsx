import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq, and, sql } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreIcon, ExternalLinkIcon } from "lucide-react";

export default async function ResearchShopsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const researchRows = await db
    .select({
      shopId: schema.userResearch.shopId,
    })
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
      ? await db.query.shops.findMany({
          where: (s, { inArray }) => inArray(s.id, shopIds),
        })
      : [];

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
              Buka halaman toko di Shopee atau TikTok Shop saat extension aktif.
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Riset Toko</h1>
        <p className="text-slate-600 mt-0.5 text-sm">{shops.length} toko</p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Toko</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Platform</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Followers</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Produk</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Rating</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shops.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/research/shops/${encodeURIComponent(s.id)}`}
                    className="font-medium text-slate-800 hover:text-[#1E40AF]"
                  >
                    {s.name}
                  </Link>
                  {s.username && (
                    <p className="text-xs text-slate-400">@{s.username}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize text-xs">{s.marketplace}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {s.followerCount?.toLocaleString("id-ID") ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {s.totalProducts?.toLocaleString("id-ID") ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {s.rating ? `${s.rating.toFixed(1)} ★` : "—"}
                </td>
                <td className="px-4 py-3">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1E40AF]">
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
        {shops.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <Link
                href={`/dashboard/research/shops/${encodeURIComponent(s.id)}`}
                className="font-medium text-slate-800 hover:text-[#1E40AF] text-sm"
              >
                {s.name}
              </Link>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize text-xs">{s.marketplace}</Badge>
                {s.followerCount && (
                  <span className="text-xs text-slate-500">{s.followerCount.toLocaleString("id-ID")} followers</span>
                )}
                {s.rating && <span className="text-xs text-slate-500">{s.rating.toFixed(1)} ★</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
