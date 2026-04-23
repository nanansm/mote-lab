import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ExternalLinkIcon, BookmarkIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Followers", value: shop.followerCount?.toLocaleString("id-ID") ?? "—" },
          { label: "Total Produk", value: shop.totalProducts?.toLocaleString("id-ID") ?? "—" },
          { label: "Rating", value: shop.rating ? `${shop.rating.toFixed(1)} ★` : "—" },
          { label: "Bergabung", value: shop.joinedDate ?? "—" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["ID Toko", shop.externalId],
              ["Pertama Dilihat", formatDate(shop.firstSeenAt)],
              ["Terakhir Update", formatDate(shop.lastSeenAt)],
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
