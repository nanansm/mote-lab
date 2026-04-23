"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircleIcon, ChromeIcon, ArrowRightIcon, DownloadIcon } from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Akun dibuat",
    description: "Akun Mote LAB kamu sudah aktif dengan trial 7 hari.",
    done: true,
  },
  {
    step: 2,
    title: "Install Extension Chrome",
    description: "Install extension Mote LAB agar bisa scrape data marketplace.",
    done: false,
  },
  {
    step: 3,
    title: "Mulai Riset",
    description: "Buka shopee.co.id atau tokopedia.com/shop dan mulai riset!",
    done: false,
  },
];

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="size-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Selamat Datang di Mote LAB!</h1>
        <p className="text-slate-600 mt-2">Akun kamu sudah aktif. Yuk setup extension-nya.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Setup dalam 3 Langkah</CardTitle>
          <CardDescription>Ikuti langkah berikut untuk mulai riset marketplace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {steps.map((s) => (
            <div key={s.step} className="flex items-start gap-4">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  s.done
                    ? "bg-green-500 text-white"
                    : "bg-[#1E40AF] text-white"
                }`}
              >
                {s.done ? <CheckCircleIcon className="size-4" /> : s.step}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="font-semibold text-slate-900 text-sm">{s.title}</div>
                <div className="text-sm text-slate-600">{s.description}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Extension install card */}
      <Card className="border-[#1E40AF]/20 bg-blue-50/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <ChromeIcon className="size-8 text-[#1E40AF]" />
            <div>
              <div className="font-semibold text-slate-900">Mote LAB Extension</div>
              <div className="text-xs text-slate-500">Chrome Extension · Manifest V3</div>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Extension ini akan aktif secara otomatis saat kamu buka Shopee atau Tokopedia.
            Data dikumpulkan saat browsing natural — tidak ada auto-click atau notifikasi
            mengganggu.
          </p>
          <Button
            disabled
            className="w-full"
            title="Extension akan tersedia setelah Phase 1 selesai"
          >
            <DownloadIcon className="size-4" />
            Download Extension (Segera Hadir)
          </Button>
          <p className="text-xs text-center text-slate-400">
            Extension sedang dalam pengembangan. Kamu akan diberitahu via email saat siap.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1 bg-[#1E40AF] hover:bg-[#1d4ed8]">
          <Link href="/dashboard">
            Ke Dashboard
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
        <Button variant="ghost" asChild className="flex-1">
          <Link href="/dashboard">Lewati untuk sekarang</Link>
        </Button>
      </div>
    </div>
  );
}
