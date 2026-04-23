"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ControlPanelLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";
    const website = honeypotRef.current?.value ?? "";

    try {
      const res = await fetch("/api/auth/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, website }),
      });

      if (res.ok) {
        router.push("/owner");
        return;
      }

      if (res.status === 429) {
        setError("Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
      } else {
        setError("Autentikasi gagal.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <p className="text-gray-500 text-xs text-center uppercase tracking-widest mb-8">
          Internal Access
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot — hidden from real users, bots will fill it */}
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
          />

          <div>
            <label htmlFor="cp-email" className="block text-xs text-gray-500 mb-1.5">
              Email
            </label>
            <input
              ref={emailRef}
              id="cp-email"
              type="email"
              name="email"
              required
              autoComplete="username"
              className="w-full bg-gray-900 border border-gray-800 text-gray-100 text-sm rounded-md px-3 py-2.5 outline-none focus:border-gray-600 focus:ring-0 placeholder-gray-700"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="cp-password" className="block text-xs text-gray-500 mb-1.5">
              Password
            </label>
            <input
              ref={passwordRef}
              id="cp-password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full bg-gray-900 border border-gray-800 text-gray-100 text-sm rounded-md px-3 py-2.5 outline-none focus:border-gray-600 focus:ring-0"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-100 text-sm font-medium rounded-md py-2.5 transition-colors"
          >
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
