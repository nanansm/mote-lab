"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTimeSecWIB, formatDateTimeWIB } from "@/lib/utils";

export interface WebhookLogRow {
  id: string;
  source: string;
  status: string;
  trxId: string | null;
  errorMessage: string | null;
  rawBody: string;
  parsedData: Record<string, unknown> | null;
  createdAt: string;
  processedAt: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  received:  "bg-blue-100 text-blue-700 border-blue-200",
  processed: "bg-green-100 text-green-700 border-green-200",
  error:     "bg-red-100 text-red-700 border-red-200",
};

export function WebhookLogsTable({ logs }: { logs: WebhookLogRow[] }) {
  const [detail, setDetail] = useState<WebhookLogRow | null>(null);

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-500">
        Tidak ada webhook logs ditemukan.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-medium text-slate-500 whitespace-nowrap">Created At</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Source</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Trx ID</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Error</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50">
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDateTimeSecWIB(log.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {log.source}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_BADGE[log.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500">
                  {log.trxId ? `${log.trxId.slice(0, 12)}…` : "—"}
                </TableCell>
                <TableCell
                  className="text-xs text-red-600 max-w-[240px] truncate"
                  title={log.errorMessage ?? undefined}
                >
                  {log.errorMessage ? log.errorMessage.slice(0, 60) + (log.errorMessage.length > 60 ? "…" : "") : "—"}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => setDetail(log)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail modal */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              Log {detail?.id.slice(0, 16)}…
            </DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4 text-sm">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-slate-500">Source</span>
                <span className="font-medium">{detail.source}</span>
                <span className="text-slate-500">Status</span>
                <Badge
                  variant="outline"
                  className={`w-fit text-xs ${STATUS_BADGE[detail.status] ?? ""}`}
                >
                  {detail.status}
                </Badge>
                <span className="text-slate-500">Trx ID</span>
                <span className="font-mono">{detail.trxId ?? "—"}</span>
                <span className="text-slate-500">Created At</span>
                <span>{formatDateTimeSecWIB(detail.createdAt)}</span>
                <span className="text-slate-500">Processed At</span>
                <span>{formatDateTimeSecWIB(detail.processedAt)}</span>
              </div>

              {/* Error */}
              {detail.errorMessage && (
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1">Error</p>
                  <p className="text-xs text-red-700 bg-red-50 rounded p-2 font-mono whitespace-pre-wrap break-all">
                    {detail.errorMessage}
                  </p>
                </div>
              )}

              {/* Raw body */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Raw Body</p>
                <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                  {detail.rawBody}
                </pre>
              </div>

              {/* Parsed data */}
              {detail.parsedData && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Parsed Data</p>
                  <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-x-auto whitespace-pre font-mono">
                    {JSON.stringify(detail.parsedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
