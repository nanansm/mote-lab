"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2Icon, ChromeIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";

const trialFeatures = [
  "Akses semua fitur selama 7 hari",
  "Shopee & TikTok Shop",
  "100 riset produk/hari",
  "Tidak perlu kartu kredit",
];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleRegister() {
    setLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/onboarding",
      });
    } catch {
      toast.error("Gagal mendaftar. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">Mulai Gratis 7 Hari</CardTitle>
        <CardDescription>Tidak perlu kartu kredit. Daftar dalam 10 detik.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Trial benefits */}
        <div className="bg-blue-50 rounded-xl p-4 space-y-2.5">
          {trialFeatures.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5">
              <div className="w-5 h-5 bg-[#1E40AF] rounded-full flex items-center justify-center shrink-0">
                <CheckIcon className="size-3 text-white" />
              </div>
              <span className="text-sm text-slate-700 font-medium">{feature}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full h-11 text-sm font-medium bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"
          variant="outline"
        >
          {loading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <ChromeIcon className="size-4" />
          )}
          {loading ? "Mengarahkan ke Google..." : "Daftar dengan Google"}
        </Button>

        <p className="text-center text-xs text-slate-500 leading-relaxed">
          Dengan mendaftar, kamu menyetujui{" "}
          <Link href="/terms" className="text-[#1E40AF] hover:underline">
            Terms of Service
          </Link>{" "}
          dan{" "}
          <Link href="/privacy" className="text-[#1E40AF] hover:underline">
            Privacy Policy
          </Link>{" "}
          kami.
        </p>

        <div className="text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-[#1E40AF] hover:underline">
            Masuk
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
