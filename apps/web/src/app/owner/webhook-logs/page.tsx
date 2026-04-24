import { db, schema } from "@mote-lab/db";
import { desc, eq, sql, and } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { WebhookLogsTable, type WebhookLogRow } from "./webhook-logs-table";

export const metadata = { title: "Webhook Logs — Owner Panel" };

const PAGE_SIZE = 50;

const VALID_SOURCES  = ["all", "ipaymu"] as const;
const VALID_STATUSES = ["all", "received", "processed", "error"] as const;
type SourceFilter  = (typeof VALID_SOURCES)[number];
type StatusFilter  = (typeof VALID_STATUSES)[number];

interface Props {
  searchParams: Promise<{ source?: string; status?: string; page?: string }>;
}

export default async function OwnerWebhookLogsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const sourceParam = (VALID_SOURCES as readonly string[]).includes(sp.source ?? "")
    ? (sp.source as SourceFilter)
    : "all";
  const statusParam = (VALID_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as StatusFilter)
    : "all";
  const page   = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // Build where conditions
  const conditions = [
    sourceParam !== "all" ? eq(schema.webhookLogs.source, sourceParam) : null,
    statusParam !== "all" ? eq(schema.webhookLogs.status, statusParam) : null,
  ].filter(Boolean);

  const whereClause = conditions.length > 0
    ? (conditions.length === 1 ? conditions[0]! : and(...(conditions as Parameters<typeof and>)))
    : sql`TRUE`;

  const [rawLogs, totalRow, statsRow] = await Promise.all([
    db
      .select()
      .from(schema.webhookLogs)
      .where(whereClause)
      .orderBy(desc(schema.webhookLogs.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.webhookLogs)
      .where(whereClause)
      .then((r) => r[0]?.count ?? 0),
    db
      .select({
        total:     sql<number>`COUNT(*)::int`,
        received:  sql<number>`COUNT(CASE WHEN ${schema.webhookLogs.status} = 'received' THEN 1 END)::int`,
        processed: sql<number>`COUNT(CASE WHEN ${schema.webhookLogs.status} = 'processed' THEN 1 END)::int`,
        errors:    sql<number>`COUNT(CASE WHEN ${schema.webhookLogs.status} = 'error' THEN 1 END)::int`,
      })
      .from(schema.webhookLogs)
      .then((r) => r[0]),
  ]);

  const stats = statsRow ?? { total: 0, received: 0, processed: 0, errors: 0 };
  const totalPages = Math.max(1, Math.ceil(totalRow / PAGE_SIZE));

  const logs: WebhookLogRow[] = rawLogs.map((l) => ({
    id: l.id,
    source: l.source,
    status: l.status,
    trxId: l.trxId,
    errorMessage: l.errorMessage,
    rawBody: l.rawBody,
    parsedData: (l.parsedData as Record<string, unknown>) ?? null,
    createdAt: l.createdAt.toISOString(),
    processedAt: l.processedAt?.toISOString() ?? null,
  }));

  const STAT_CARDS = [
    { label: "Total Logs",  value: Number(stats.total).toLocaleString("id-ID") },
    { label: "Received",    value: Number(stats.received).toLocaleString("id-ID") },
    { label: "Processed",   value: Number(stats.processed).toLocaleString("id-ID") },
    { label: "Error",       value: Number(stats.errors).toLocaleString("id-ID") },
  ];

  const filterHref = (s: string, st: string) =>
    `/owner/webhook-logs?source=${s}&status=${st}&page=1`;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Webhook Logs</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Semua payload webhook masuk dari iPaymu.
        </p>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Source */}
        <div className="flex gap-1.5">
          <span className="text-xs text-slate-500 self-center mr-1">Source:</span>
          {VALID_SOURCES.map((s) => (
            <Link
              key={s}
              href={filterHref(s, statusParam)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                sourceParam === s
                  ? "bg-[#1E40AF] text-white border-[#1E40AF]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {s === "all" ? "Semua" : s}
            </Link>
          ))}
        </div>

        {/* Status */}
        <div className="flex gap-1.5">
          <span className="text-xs text-slate-500 self-center mr-1">Status:</span>
          {VALID_STATUSES.map((s) => (
            <Link
              key={s}
              href={filterHref(sourceParam, s)}
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
      </div>

      {/* Table */}
      <WebhookLogsTable logs={logs} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          {page > 1 && (
            <Link
              href={filterHref(sourceParam, statusParam) + `&page=${page - 1}`.replace("page=1&", "")}
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
              href={`/owner/webhook-logs?source=${sourceParam}&status=${statusParam}&page=${page + 1}`}
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
