"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { PLAN_LABELS } from "@mote-lab/shared";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  subscription: {
    id: string;
    plan: string;
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  } | null;
};

type PendingAction =
  | { type: "change"; userId: string; email: string; plan: string; planLabel: string }
  | { type: "extend"; userId: string; email: string; days: number }
  | { type: "cancel"; userId: string; email: string };

const PLAN_OPTIONS: { value: string; label: string }[] = [
  { value: "trial", label: "Trial (7 hari)" },
  { value: "starter", label: "Starter (30 hari)" },
  { value: "pro", label: "Pro (30 hari)" },
  { value: "lifetime", label: "Lifetime" },
];

function planBadgeClass(plan: string, status: string) {
  if (status === "cancelled") return "bg-slate-100 text-slate-500";
  if (status === "expired") return "bg-red-100 text-red-600";
  switch (plan) {
    case "trial": return "bg-yellow-100 text-yellow-700";
    case "starter": return "bg-blue-100 text-blue-700";
    case "pro": return "bg-purple-100 text-purple-700";
    case "lifetime": return "bg-green-100 text-green-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      search.trim()
        ? users.filter((u) =>
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            (u.name ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : users,
    [users, search]
  );

  async function executeAction() {
    if (!pending) return;
    setLoading(true);

    let body: Record<string, unknown>;
    if (pending.type === "change") {
      body = { action: "change", plan: pending.plan };
    } else if (pending.type === "extend") {
      body = { action: "extend", days: pending.days };
    } else {
      body = { action: "cancel" };
    }

    try {
      const res = await fetch(`/api/owner/users/${pending.userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengupdate subscription.");
        return;
      }

      toast.success("Subscription berhasil diupdate.");
      setPending(null);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function dialogDescription() {
    if (!pending) return "";
    if (pending.type === "change") {
      return `Ganti plan ${pending.email} ke ${pending.planLabel}?`;
    }
    if (pending.type === "extend") {
      return `Extend subscription ${pending.email} sebanyak ${pending.days} hari?`;
    }
    return `Cancel subscription ${pending.email}? Status akan berubah ke "cancelled".`;
  }

  return (
    <>
      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Cari email atau nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Trial Ends / Period End</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead className="w-60">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-10">
                  {search ? "Tidak ada user yang cocok." : "Belum ada user."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const sub = user.subscription;
                const planLabel =
                  sub ? (PLAN_LABELS[sub.plan as keyof typeof PLAN_LABELS] ?? sub.plan) : "-";
                const endDate = sub?.trialEndsAt ?? sub?.currentPeriodEnd ?? null;
                const isOwner = user.role === "owner";

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{user.email}</p>
                        {user.name && (
                          <p className="text-xs text-slate-400">{user.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isOwner ? (
                        <Badge variant="default" className="text-xs">Owner</Badge>
                      ) : sub ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planBadgeClass(sub.plan, sub.status)}`}
                        >
                          {planLabel}
                          {sub.status === "cancelled" && " (Cancelled)"}
                          {sub.status === "expired" && " (Expired)"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Tidak ada</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {endDate ? formatDate(endDate) : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {!isOwner && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Change Plan */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                                Ganti Plan
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel className="text-xs">Pilih Plan</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {PLAN_OPTIONS.map((opt) => (
                                <DropdownMenuItem
                                  key={opt.value}
                                  onSelect={() =>
                                    setPending({
                                      type: "change",
                                      userId: user.id,
                                      email: user.email,
                                      plan: opt.value,
                                      planLabel: opt.label,
                                    })
                                  }
                                >
                                  {opt.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Extend 30 days */}
                          {sub && sub.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2"
                              onClick={() =>
                                setPending({
                                  type: "extend",
                                  userId: user.id,
                                  email: user.email,
                                  days: 30,
                                })
                              }
                            >
                              +30 Hari
                            </Button>
                          )}

                          {/* Cancel */}
                          {sub && sub.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() =>
                                setPending({
                                  type: "cancel",
                                  userId: user.id,
                                  email: user.email,
                                })
                              }
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        {filtered.length} dari {users.length} user ditampilkan
      </p>

      {/* Confirmation Dialog */}
      <Dialog open={!!pending} onOpenChange={(open) => !open && !loading && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
            <DialogDescription>{dialogDescription()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPending(null)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={executeAction}
              disabled={loading}
              variant={pending?.type === "cancel" ? "destructive" : "default"}
            >
              {loading && <Loader2Icon className="size-4 animate-spin" />}
              {loading ? "Memproses..." : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
