import Link from "next/link";
import { ZapIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <ZapIcon className="size-5 text-orange-400" />
              Mote LAB
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tool riset produk marketplace berbasis hybrid architecture. Data lebih akurat,
              harga lebih terjangkau.
            </p>
            <p className="text-sm text-slate-400">
              Kontak:{" "}
              <a
                href="mailto:motekreatif@gmail.com"
                className="text-orange-400 hover:text-orange-300"
              >
                motekreatif@gmail.com
              </a>
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">
              Produk
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Fitur", href: "#features" },
                { label: "Harga", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">
              Akun
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Daftar", href: "/register" },
                { label: "Masuk", href: "/login" },
                { label: "Dashboard", href: "/dashboard" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-slate-700" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Mote Kreatif. Semua hak dilindungi.
          </p>

          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-600 text-center leading-relaxed">
          Shopee, Tokopedia, Tokopedia, dan Lazada adalah merek dagang dari pemiliknya
          masing-masing. Mote LAB tidak berafiliasi dengan platform tersebut. Mote LAB adalah
          browser helper tool yang membantu pengguna melihat informasi yang sudah publicly
          available di marketplace.
        </p>
      </div>
    </footer>
  );
}
