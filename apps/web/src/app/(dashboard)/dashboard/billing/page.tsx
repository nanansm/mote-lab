"use client";

import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, ZapIcon } from "lucide-react";
import { PLAN_LABELS, PLAN_LIMITS } from "@mote-lab/shared";
import { formatCurrency } from "@/lib/utils";

type Plan = "starter" | "pro" | "lifetime";

const upgradePlans: {
  name: Plan;
  price: number;
  period: string;
  features: string[];
  recommended?: boolean;
}[] = [
  {
    name: "starter",
    price: 99000,
    period: "/bulan",
    features: ["1 marketplace", "500 riset/hari", "History 30 hari", "Export CSV"],
  },
  {
    name: "pro",
    price: 199000,
    period: "/bulan",
    recommended: true,
    features: [
      "Semua marketplace",
      "Unlimited riset/hari",
      "History 90 hari",
      "Trending alerts",
      "Priority support",
    ],
  },
  {
    name: "lifetime",
    price: 1999000,
    period: "sekali bayar",
    features: [
      "Semua fitur Pro",
      "Update seumur hidup",
      "Akses beta fitur baru",
    ],
  },
];

export default function BillingPage() {
  const { data: session } = useSession();

  function handleUpgrade(plan: Plan) {
    toast.info(`Integrasi Xendit untuk plan ${PLAN_LABELS[plan]} akan hadir di Phase 2.`, {
      description: "Saat ini pembayaran belum tersedia. Pantau update kami.",
      duration: 5000,
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-600 mt-1 text-sm">Kelola plan dan pembayaran kamu.</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan Aktif</CardTitle>
          <CardDescription>Status langganan kamu saat ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">
                {PLAN_LABELS["trial"]}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">
                Akses penuh selama 7 hari trial
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">Aktif</Badge>
          </div>

          <div className="text-sm text-slate-600 pt-2 border-t">
            Limit hari ini:{" "}
            <span className="font-semibold text-slate-900">
              {PLAN_LIMITS["trial"].dailyLimit} riset/hari
            </span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Upgrade options */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Upgrade Plan</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {upgradePlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.recommended ? "border-[#1E40AF] shadow-md" : ""}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#1E40AF] text-white border-0">
                    <ZapIcon className="size-3" />
                    Paling Populer
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-base capitalize">{PLAN_LABELS[plan.name]}</CardTitle>
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
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckIcon className="size-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade(plan.name)}
                  className={`w-full ${plan.recommended ? "bg-[#1E40AF] hover:bg-[#1d4ed8]" : ""}`}
                  variant={plan.recommended ? "default" : "outline"}
                >
                  Pilih {PLAN_LABELS[plan.name]}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          Pembayaran via Xendit (VA, e-wallet, QRIS, kartu kredit). Tersedia di Phase 2.
        </p>
      </div>

      {/* Invoice history */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Riwayat Invoice</h2>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-slate-500">Belum ada riwayat pembayaran.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
