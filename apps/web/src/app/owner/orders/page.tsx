import { db, schema } from "@mote-lab/db";
import { desc, eq, sql, inArray } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { OrdersTable, type OrderRow } from "./orders-table";

export const metadata = { title: "Orders — Owner Panel" };

const PAGE_SIZE = 50;
const VALID_STATUSES = ["all", "pending", "paid", "manual_approved", "failed", "expired"] as const;
type StatusFilter = (typeof VALID_STATUSES)[number];

const PAID_STATUSES = ["paid", "manual_approved"];

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function OwnerOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const statusParam = (VALID_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as StatusFilter)
    : "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // ── Aggregate stats ───────────────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [statsRows, totalCount] = await Promise.all([
    db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${schema.orders.status} IN ('paid','manual_approved') THEN ${schema.orders.amount} ELSE 0 END), 0)`,
        monthRevenue:  sql<number>`COALESCE(SUM(CASE WHEN ${schema.orders.status} IN ('paid','manual_approved') AND ${schema.orders.createdAt} >= ${monthStart} THEN ${schema.orders.amount} ELSE 0 END), 0)`,
        totalOrders:   sql<number>`COUNT(*)::int`,
        pendingOrders: sql<number>`COUNT(CASE WHEN ${schema.orders.status} = 'pending' THEN 1 END)::int`,
      })
      .from(schema.orders),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.orders)
      .where(statusParam !== "all" ? eq(schema.orders.status, statusParam) : sql`TRUE`)
      .then((r) => r[0]?.count ?? 0),
  ]);

  const stats = statsRows[0] ?? { totalRevenue: 0, monthRevenue: 0, totalOrders: 0, pendingOrders: 0 };

  // ── Fetch paged orders ────────────────────────────────────────────────────────
  const rawOrders = await db
    .select()
    .from(schema.orders)
    .where(statusParam !== "all" ? eq(schema.orders.status, statusParam) : sql`TRUE`)
    .orderBy(desc(schema.orders.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  // Lookup user emails
  const userIds = [...new Set(rawOrders.map((o) => o.userId))];
  const users =
    userIds.length > 0
      ? await db
          .select({ id: schema.users.id, email: schema.users.email })
          .from(schema.users)
          .where(inArray(schema.users.id, userIds))
      : [];
  const emailMap = new Map(users.map((u) => [u.id, u.email]));

  const orders: OrderRow[] = rawOrders.map((o) => ({
    id: o.id,
    userEmail: emailMap.get(o.userId) ?? o.userId,
    plan: o.plan,
    amount: Number(o.amount),
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const STAT_CARDS = [
    { label: "Total Revenue", value: formatCurrency(Number(stats.totalRevenue)) },
    { label: "Revenue Bulan Ini", value: formatCurrency(Number(stats.monthRevenue)) },
    { label: "Total Orders", value: Number(stats.totalOrders).toLocaleString("id-ID") },
    { label: "Pending", value: Number(stats.pendingOrders).toLocaleString("id-ID") },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-600 mt-1 text-sm">Semua payment orders dari iPaymu.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label} className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {VALID_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/owner/orders?status=${s}&page=1`}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusParam === s
                ? "bg-[#1E40AF] text-white border-[#1E40AF]"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {s === "all" ? "Semua" : s}
          </Link>
        ))}
      </div>

      {/* Table */}
      <OrdersTable orders={orders} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          {page > 1 && (
            <Link
              href={`/owner/orders?status=${statusParam}&page=${page - 1}`}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Prev
            </Link>
          )}
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/owner/orders?status=${statusParam}&page=${page + 1}`}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
