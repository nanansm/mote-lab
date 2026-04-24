"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Loader2Icon } from "lucide-react";
import { formatCurrency, formatDateTimeWIB } from "@/lib/utils";

export interface OrderRow {
  id: string;
  userEmail: string;
  plan: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-700 border-yellow-200",
  paid:             "bg-green-100 text-green-700 border-green-200",
  manual_approved:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed:           "bg-red-100 text-red-700 border-red-200",
  expired:          "bg-slate-100 text-slate-500 border-slate-200",
};

const PLAN_BADGE: Record<string, string> = {
  starter:  "bg-green-100 text-green-700 border-green-200",
  pro:      "bg-blue-100 text-blue-700 border-blue-200",
  lifetime: "bg-purple-100 text-purple-700 border-purple-200",
};

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [approving, startApprove] = useTransition();
  const [confirmOrder, setConfirmOrder] = useState<OrderRow | null>(null);

  function handleApprove() {
    if (!confirmOrder) return;
    const id = confirmOrder.id;
    startApprove(async () => {
      const res = await fetch(`/api/owner/orders/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast.success(`Order ${id.slice(0, 8)}… berhasil di-approve`);
        router.refresh();
      } else {
        toast.error(json.error ?? "Gagal approve order");
      }
      setConfirmOrder(null);
    });
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-500">
        Tidak ada orders ditemukan.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-medium text-slate-500">Order ID</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">User</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Plan</TableHead>
              <TableHead className="text-right text-xs font-medium text-slate-500">Amount</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Created</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Paid At</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} className="hover:bg-slate-50">
                <TableCell className="font-mono text-xs text-slate-500">
                  {o.id.slice(0, 12)}…
                </TableCell>
                <TableCell className="text-sm text-slate-700">{o.userEmail}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${PLAN_BADGE[o.plan] ?? ""}`}
                  >
                    {o.plan}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm font-medium text-slate-800">
                  {formatCurrency(o.amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_BADGE[o.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {o.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDateTimeWIB(o.createdAt)}
                </TableCell>
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {o.paidAt ? formatDateTimeWIB(o.paidAt) : "—"}
                </TableCell>
                <TableCell>
                  {o.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => setConfirmOrder(o)}
                    >
                      Approve Manual
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirm dialog */}
      <Dialog open={!!confirmOrder} onOpenChange={(o) => !o && !approving && setConfirmOrder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve Manual Order?</DialogTitle>
            <DialogDescription>
              Yakin approve manual order{" "}
              <span className="font-mono font-semibold">
                {confirmOrder?.id.slice(0, 12)}…
              </span>
              ? Plan user akan langsung aktif.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOrder(null)}
              disabled={approving}
            >
              Batal
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-[#1E40AF] hover:bg-[#1d4ed8]"
            >
              {approving ? <Loader2Icon className="size-4 animate-spin" /> : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
