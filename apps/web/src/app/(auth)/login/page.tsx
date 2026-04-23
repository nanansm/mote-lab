"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2Icon, ChromeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      toast.error("Gagal login dengan Google. Coba lagi.");
      setGoogleLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">Masuk ke Mote LAB</CardTitle>
        <CardDescription>Login dengan Google untuk melanjutkan</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        <Button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full h-11 text-sm font-medium bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"
          variant="outline"
        >
          {googleLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <ChromeIcon className="size-4" />
          )}
          {googleLoading ? "Mengarahkan..." : "Lanjutkan dengan Google"}
        </Button>

        <div className="text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-[#1E40AF] hover:underline">
            Daftar gratis
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
