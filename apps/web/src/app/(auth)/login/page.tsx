"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2Icon, ChromeIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/lib/auth-client";
import { type SignInInput, signInSchema } from "@mote-lab/shared";

export default function LoginPage() {
  const router = useRouter();
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

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

  async function handleOwnerLogin(data: SignInInput) {
    const res = await signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: "/owner",
    });

    if (res.error) {
      toast.error("Email atau password salah.");
      return;
    }

    router.push("/owner");
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

        <Separator />

        {/* Owner login toggle */}
        <button
          type="button"
          onClick={() => setShowOwnerForm(!showOwnerForm)}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors mx-auto"
        >
          <ChevronDownIcon
            className={`size-3 transition-transform ${showOwnerForm ? "rotate-180" : ""}`}
          />
          Login sebagai Owner
        </button>

        {showOwnerForm && (
          <form onSubmit={handleSubmit(handleOwnerLogin)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="owner@motekreatif.com"
                autoComplete="email"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              Masuk sebagai Owner
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
