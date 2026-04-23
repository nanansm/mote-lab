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
  PuzzleIcon,
  DownloadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuotaBar } from "./quota-bar";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon, exact: true },
  { label: "Riset Produk", href: "/dashboard/research/products", icon: SearchIcon },
  { label: "Riset Toko", href: "/dashboard/research/shops", icon: StoreIcon },
  { label: "Saved", href: "/dashboard/saved", icon: BookmarkIcon },
  { label: "Extension", href: "/dashboard/extension", icon: PuzzleIcon },
  { label: "Install Extension", href: "/dashboard/install-extension", icon: DownloadIcon },
  { label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCardIcon },
];

export function Sidebar({
  className,
  quotaUsed = 0,
  quotaLimit = 100,
  plan = "trial",
}: {
  className?: string;
  quotaUsed?: number;
  quotaLimit?: number;
  plan?: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn("flex flex-col w-64 border-r bg-white min-h-screen", className)}>
      <div className="flex items-center gap-2 h-16 px-5 border-b font-bold text-lg">
        <ZapIcon className="size-5 text-orange-500" />
        <span className="text-[#1E40AF]">Mote LAB</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-[#1E40AF]/10 text-[#1E40AF]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t">
        <QuotaBar used={quotaUsed} limit={quotaLimit} plan={plan} />
      </div>
    </aside>
  );
}
