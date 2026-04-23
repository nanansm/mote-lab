import { StoreIcon, ChromeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function ResearchShopsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Riset Toko</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Track performa toko pesaing di Shopee & TikTok Shop.
        </p>
      </div>

      <Card className="border-dashed border-2 border-slate-200">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <StoreIcon className="size-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Data Toko</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
            Buka halaman toko di Shopee atau TikTok Shop saat extension aktif. Data toko
            akan otomatis disimpan untuk analisis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button disabled>
              <ChromeIcon className="size-4" />
              Download Extension (Segera Hadir)
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Kembali ke Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
