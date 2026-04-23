"use client";

import { useEffect, useState } from "react";
import { ZapIcon, CheckCircleIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  user: { name: string; email: string };
};

type Status = "loading" | "success" | "error";

export function ExtensionAuthClient({ user }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [token, setToken] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function generateToken() {
      try {
        const res = await fetch("/api/extension/token", {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Token generation failed");
        const data = await res.json();
        setToken(data.token);
        setStatus("success");

        // Try to send token to extension via postMessage
        window.postMessage(
          { type: "MOTE_LAB_AUTH_TOKEN", token: data.token, user: data.user },
          window.location.origin,
        );
      } catch {
        setStatus("error");
      }
    }
    generateToken();
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border p-8 text-center">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#1E40AF] rounded-xl flex items-center justify-center">
            <ZapIcon className="size-5 text-white" />
          </div>
          <span className="font-bold text-xl text-[#1E40AF]">Mote LAB</span>
        </div>

        <h1 className="text-lg font-semibold text-slate-900 mb-1">
          Authorize Extension
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Login sebagai{" "}
          <span className="font-medium text-slate-700">{user.email}</span>
        </p>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2Icon className="size-8 text-[#1E40AF] animate-spin" />
            <p className="text-sm text-slate-500">Membuat token...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <CheckCircleIcon className="size-5" />
              <span className="text-sm font-medium">Token berhasil dibuat</span>
            </div>

            {/* Token display — only shown if extension isn't detected */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left">
              <p className="text-xs text-slate-500 mb-1">Token (satu kali tampil)</p>
              <code className="text-xs text-slate-800 break-all font-mono">
                {token.slice(0, 16)}...{token.slice(-8)}
              </code>
            </div>

            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              Extension sudah terkoneksi secara otomatis. Kamu bisa menutup halaman ini.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCopy}
              >
                {copied ? "Tersalin!" : "Copy token"}
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-[#1E40AF] hover:bg-[#1d4ed8]"
                onClick={() => window.close()}
              >
                Tutup
              </Button>
            </div>

            <p className="text-xs text-slate-400">
              Token berlaku 30 hari. Buka halaman ini lagi untuk generate token baru.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircleIcon className="size-5" />
              <span className="text-sm font-medium">Gagal membuat token</span>
            </div>
            <p className="text-sm text-slate-600">
              Pastikan kamu sudah login dan coba refresh halaman.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Coba Lagi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
