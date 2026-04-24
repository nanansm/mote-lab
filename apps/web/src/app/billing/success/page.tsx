import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-10 pb-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2Icon className="size-8 text-green-600" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-slate-900">
              Pembayaran Berhasil!
            </h1>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              Pembayaran sedang diverifikasi. Plan Anda akan aktif dalam 1–5 menit.
            </p>
          </div>

          <p className="text-xs text-slate-400">
            Jika plan belum aktif setelah 10 menit, hubungi support.
          </p>

          <Button asChild className="bg-[#1E40AF] hover:bg-[#1d4ed8] w-full">
            <Link href="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
