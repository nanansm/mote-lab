import { BookmarkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SavedPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Saved</h1>
        <p className="text-slate-600 mt-1 text-sm">Produk dan toko yang kamu bookmark.</p>
      </div>

      <Card className="border-dashed border-2 border-slate-200">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BookmarkIcon className="size-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Item Tersimpan</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
            Saat riset di marketplace, klik tombol bookmark di overlay Mote LAB untuk menyimpan
            produk atau toko yang menarik.
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
