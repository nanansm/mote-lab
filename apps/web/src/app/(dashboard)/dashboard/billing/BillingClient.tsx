"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckIcon, ZapIcon, LoaderIcon } from "lucide-react";
import { PLAN_LABELS, PLAN_LIMITS } from "@mote-lab/shared";
import { formatCurrency, formatDate } from "@/lib/utils";

type Plan = "starter" | "pro" | "lifetime";

const UPGRADE_PLANS: {
  name: Plan;
  price: number;
  period: string;
  features: string[];
  recommended?: boolean;
}[] = [
  {
    name: "starter",
    price: 99_000,
    period: "/bulan",
    features: [
      "Shopee & Tokopedia",
      `${PLAN_LIMITS.starter.dailyLimit} riset/hari`,
      `History ${PLAN_LIMITS.starter.historyDays} hari`,
      "Export CSV",
    ],
  },
  {
    name: "pro",
    price: 199_000,
    period: "/bulan",
    recommended: true,
    features: [
      "Semua marketplace",
      "Unlimited riset/hari",
      `History ${PLAN_LIMITS.pro.historyDays} hari`,
      "Trending alerts",
      "Priority support",
    ],
  },
  {
    name: "lifetime",
    price: 1_999_000,
    period: "sekali bayar",
    features: [
      "Semua fitur Pro",
      "Update seumur hidup",
      "Akses beta fitur baru",
    ],
  },
];

const PHONE_RE = /^(\+?62|0)8\d{8,12}$/;

interface Props {
  currentPlan: string;
  planStatus: string;
  expiryDate: string | null; // ISO string or null
  isLifetime: boolean;
}

export function BillingClient({
  currentPlan,
  planStatus,
  expiryDate,
  isLifetime,
}: Props) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  function openModal(plan: Plan) {
    setSelectedPlan(plan);
    setPhone("");
    setPhoneError("");
  }

  function closeModal() {
    if (loading) return;
    setSelectedPlan(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError("");

    if (!phone.trim() || !PHONE_RE.test(phone.trim())) {
      setPhoneError("Format tidak valid. Gunakan 08xxx atau +628xxx (10-13 digit).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, phone: phone.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setPhoneError(json.error ?? "Gagal membuat pembayaran. Coba lagi.");
        return;
      }

      // Redirect to iPaymu payment page
      window.location.href = json.paymentUrl;
    } catch {
      setPhoneError("Koneksi gagal. Periksa internet dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // Badge color based on plan
  const planColor =
    currentPlan === "lifetime"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : currentPlan === "pro"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : currentPlan === "starter"
          ? "bg-green-100 text-green-700 border-green-200"
          : "bg-slate-100 text-slate-600 border-slate-200";

  const expiryLabel = isLifetime
    ? "Akses seumur hidup"
    : expiryDate
      ? `Aktif hingga ${formatDate(expiryDate)}`
      : "—";

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Kelola plan dan pembayaran kamu.
          </p>
        </div>

        {/* Current plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Aktif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">
                  {PLAN_LABELS[currentPlan as keyof typeof PLAN_LABELS] ?? currentPlan}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">{expiryLabel}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={planColor}>
                  {planStatus === "active" ? "Aktif" : planStatus}
                </Badge>
              </div>
            </div>

            <div className="text-sm text-slate-600 pt-3 border-t">
              Limit hari ini:{" "}
              <span className="font-semibold text-slate-900">
                {PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS]?.dailyLimit?.toLocaleString("id-ID") ?? "—"} riset/hari
              </span>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Upgrade options */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Upgrade Plan
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {UPGRADE_PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.name;
              return (
                <Card
                  key={plan.name}
                  className={`relative ${plan.recommended ? "border-[#1E40AF] shadow-md" : ""}`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#1E40AF] text-white border-0 gap-1">
                        <ZapIcon className="size-3" />
                        Paling Populer
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base capitalize">
                      {PLAN_LABELS[plan.name]}
                    </CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-xs text-slate-500">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <CheckIcon className="size-4 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => openModal(plan.name)}
                      disabled={isCurrent}
                      className={`w-full ${plan.recommended ? "bg-[#1E40AF] hover:bg-[#1d4ed8]" : ""}`}
                      variant={plan.recommended ? "default" : "outline"}
                    >
                      {isCurrent ? "Plan Aktif" : `Pilih ${PLAN_LABELS[plan.name]}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 text-center mt-4">
            Pembayaran via iPaymu — VA Bank, e-wallet, QRIS
          </p>
        </div>
      </div>

      {/* Phone number modal */}
      <Dialog open={!!selectedPlan} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Masukkan Nomor HP</DialogTitle>
            <DialogDescription>
              Nomor HP digunakan sebagai kontak pembayaran iPaymu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08123456789"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError("");
                }}
                disabled={loading}
                autoFocus
              />
              {phoneError && (
                <p className="text-xs text-red-500">{phoneError}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#1E40AF] hover:bg-[#1d4ed8] min-w-[100px]"
              >
                {loading ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : (
                  "Bayar Sekarang"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
