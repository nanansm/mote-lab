import Link from "next/link";
import { ZapIcon } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <header className="p-4 md:p-6">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-[#1E40AF]">
          <ZapIcon className="size-5 text-orange-500" />
          Mote LAB
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">{children}</main>
      <footer className="p-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Mote Kreatif.{" "}
        <Link href="/privacy" className="hover:text-slate-600">
          Privacy Policy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="hover:text-slate-600">
          Terms
        </Link>
      </footer>
    </div>
  );
}
