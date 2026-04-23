"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  SearchIcon,
  StoreIcon,
  BookmarkIcon,
  SettingsIcon,
  CreditCardIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    label: "Riset Produk",
    href: "/dashboard/research/products",
    icon: SearchIcon,
  },
  {
    label: "Riset Toko",
    href: "/dashboard/research/shops",
    icon: StoreIcon,
  },
  {
    label: "Saved",
    href: "/dashboard/saved",
    icon: BookmarkIcon,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon,
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCardIcon,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-white min-h-screen">
      <div className="flex items-center gap-2 h-16 px-5 border-b font-bold text-lg">
        <ZapIcon className="size-5 text-orange-500" />
        <span className="text-[#1E40AF]">Mote LAB</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-[#1E40AF]/10 text-[#1E40AF]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1d4ed8] p-4 text-white text-sm">
          <div className="font-semibold mb-1">🎯 Trial Aktif</div>
          <div className="text-white/80 text-xs">
            Upgrade untuk akses unlimited riset.
          </div>
          <Link
            href="/dashboard/billing"
            className="mt-3 block text-center bg-white text-[#1E40AF] rounded-lg py-1.5 text-xs font-semibold hover:bg-white/90 transition-colors"
          >
            Upgrade Sekarang
          </Link>
        </div>
      </div>
    </aside>
  );
}
