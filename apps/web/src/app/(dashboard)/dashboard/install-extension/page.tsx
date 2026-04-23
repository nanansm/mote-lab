import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DownloadIcon,
  FolderOpenIcon,
  ToggleRightIcon,
  ZapIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  ShoppingBagIcon,
} from "lucide-react";

const steps = [
  {
    step: 1,
    icon: DownloadIcon,
    title: "Download Extension",
    desc: "Klik tombol download di bawah untuk mendapat file ZIP extension Mote LAB.",
    action: (
      <Button asChild size="sm" className="gap-2 bg-[#1E40AF] hover:bg-[#1d4ed8]">
        <a href="/api/extension/download?download=1">
          <DownloadIcon className="size-4" />
          Download ZIP
        </a>
      </Button>
    ),
  },
  {
    step: 2,
    icon: FolderOpenIcon,
    title: "Ekstrak ZIP",
    desc: 'Ekstrak file ZIP. Kamu akan mendapat folder "mote-lab-extension".',
  },
  {
    step: 3,
    icon: ToggleRightIcon,
    title: "Buka chrome://extensions",
    desc: "Di Chrome, ketik chrome://extensions di address bar. Aktifkan Developer Mode (toggle di pojok kanan atas).",
    action: (
      <Button asChild variant="outline" size="sm" className="gap-2">
        <a href="chrome://extensions" target="_blank" rel="noreferrer">
          <ExternalLinkIcon className="size-3" />
          Buka Extensions
        </a>
      </Button>
    ),
  },
  {
    step: 4,
    icon: FolderOpenIcon,
    title: 'Klik "Load Unpacked"',
    desc: 'Klik tombol "Load unpacked" lalu pilih folder yang sudah diekstrak.',
  },
  {
    step: 5,
    icon: ZapIcon,
    title: "Connect ke Mote LAB",
    desc: 'Klik icon Mote LAB di toolbar Chrome, lalu klik "Connect Extension" untuk authorize.',
    action: (
      <Button asChild size="sm" className="gap-2 bg-[#1E40AF] hover:bg-[#1d4ed8]">
        <Link href="/auth/extension" target="_blank">
          <ZapIcon className="size-4" />
          Authorize Extension
        </Link>
      </Button>
    ),
  },
  {
    step: 6,
    icon: ShoppingBagIcon,
    title: "Mulai Riset!",
    desc: "Buka Shopee atau Tokopedia. Extension akan otomatis mengumpulkan data produk.",
  },
];

export default function InstallExtensionPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Install Extension</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Panduan step-by-step install Mote LAB Chrome Extension.
        </p>
      </div>

      {/* Compatibility note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4 flex items-start gap-3">
          <CheckCircleIcon className="size-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <span className="font-semibold">Kompatibel dengan:</span> Google Chrome, Microsoft Edge,
            Brave, dan browser Chromium lainnya. Firefox belum didukung.
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((s) => (
          <Card key={s.step}>
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#1E40AF] rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {s.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{s.title}</h3>
                      <p className="text-sm text-slate-600 mt-0.5">{s.desc}</p>
                    </div>
                    {s.action && <div className="shrink-0">{s.action}</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Troubleshooting */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Troubleshooting</h2>
        <div className="space-y-2 text-sm text-slate-600">
          {[
            [
              "Extension tidak muncul di toolbar",
              'Klik icon puzzle di kanan toolbar Chrome → pin "Mote LAB".',
            ],
            [
              "Data tidak muncul di dashboard",
              "Pastikan kamu sudah connect extension via Authorize Extension. Cek juga quota harian di popup.",
            ],
            [
              "Error saat load unpacked",
              'Pastikan kamu memilih folder yang benar (folder yang berisi manifest.json), bukan file ZIP.',
            ],
          ].map(([q, a]) => (
            <details key={q} className="border rounded-lg px-4 py-3 cursor-pointer">
              <summary className="font-medium text-slate-800">{q}</summary>
              <p className="mt-2 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Badge variant="outline" className="text-xs">
          Version 1.0.0
        </Badge>
        <Badge variant="outline" className="text-xs text-slate-500">
          Chrome MV3
        </Badge>
      </div>
    </div>
  );
}
