"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, ZapIcon } from "lucide-react";

const plans = [
  {
    name: "Free Trial",
    price: "Rp 0",
    period: "7 hari",
    description: "Coba semua fitur tanpa kartu kredit.",
    badge: null,
    features: [
      "Akses semua fitur selama 7 hari",
      "100 riset produk/hari",
      "Shopee & Tokopedia",
      "Bookmark unlimited",
      "Dashboard basic",
    ],
    cta: "Mulai Gratis",
    ctaHref: "/register",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Starter",
    price: "Rp 99.000",
    period: "/bulan",
    description: "Untuk seller yang mau riset serius di 1 marketplace.",
    badge: null,
    features: [
      "1 marketplace pilihan",
      "500 riset produk/hari",
      "History data 30 hari",
      "Bookmark unlimited",
      "Export CSV",
      "Email support",
    ],
    cta: "Pilih Starter",
    ctaHref: "/register",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Rp 199.000",
    period: "/bulan",
    description: "All marketplace, unlimited riset, kompetitor tracker.",
    badge: "Paling Populer",
    features: [
      "Semua marketplace",
      "Unlimited riset/hari",
      "History data 90 hari",
      "Cross-marketplace insights",
      "Trending alerts",
      "Export CSV",
      "Priority support",
    ],
    cta: "Pilih Pro",
    ctaHref: "/register",
    ctaVariant: "default" as const,
    highlighted: true,
  },
  {
    name: "Lifetime",
    price: "Rp 1.999.000",
    period: "sekali bayar",
    description: "Pro features selamanya. Investasi terbaik untuk seller serius.",
    badge: "Early Adopter",
    features: [
      "Semua fitur Pro",
      "Unlimited selamanya",
      "Update fitur seumur hidup",
      "Akses beta fitur baru",
      "Dedicated support",
    ],
    cta: "Beli Lifetime",
    ctaHref: "/register",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-3">
            Harga Transparan
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Pilih Plan yang Sesuai
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Mulai gratis, upgrade kapan saja. Tidak ada kontrak, tidak ada biaya tersembunyi.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-200 ${
                plan.highlighted
                  ? "border-[#1E40AF] shadow-xl shadow-[#1E40AF]/10 bg-gradient-to-b from-[#1E40AF]/5 to-white scale-[1.02]"
                  : "border-slate-200 bg-white hover:shadow-md"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge
                    className={
                      plan.highlighted
                        ? "bg-[#1E40AF] text-white border-0"
                        : "bg-orange-500 text-white border-0"
                    }
                  >
                    {plan.highlighted && <ZapIcon className="size-3" />}
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className={`text-2xl md:text-3xl font-bold ${plan.highlighted ? "text-[#1E40AF]" : "text-slate-900"}`}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckIcon
                      className={`size-4 shrink-0 mt-0.5 ${plan.highlighted ? "text-[#1E40AF]" : "text-green-500"}`}
                    />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.highlighted ? "default" : plan.ctaVariant}
                className={
                  plan.highlighted
                    ? "bg-[#1E40AF] hover:bg-[#1d4ed8] text-white w-full"
                    : "w-full"
                }
              >
                <Link href={plan.ctaHref}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Semua plan sudah termasuk akses ke extension Chrome Mote LAB.
        </p>
      </div>
    </section>
  );
}
