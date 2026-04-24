import Link from "next/link";
import { XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-10 pb-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <XCircleIcon className="size-8 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-slate-900">
              Pembayaran Dibatalkan
            </h1>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              Pembayaran dibatalkan. Tidak ada biaya yang dipotong dari akun Anda.
            </p>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/billing">Kembali ke Billing</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
