import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { ZapIcon, LayoutDashboardIcon, UsersIcon, CreditCardIcon, ArrowLeftIcon } from "lucide-react";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  const cookieHeader = reqHeaders.get("cookie") ?? "";
  const cookieNames = cookieHeader.split(";").map((c) => c.trim().split("=")[0]).filter(Boolean);
  console.log("[owner-layout] session:", session ? `userId=${session.user.id}` : "null");
  console.log("[owner-layout] cookie_names:", cookieNames);

  if (!session) {
    console.log("[owner-layout] no session → redirect /");
    redirect("/");
  }

  const role = (session.user as { role?: string }).role;
  console.log("[owner-layout] role:", role);
  if (role !== "owner") {
    console.log("[owner-layout] not owner → redirect /");
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Owner sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-slate-900 text-white min-h-screen">
        <div className="flex items-center gap-2 h-16 px-4 border-b border-white/10 font-bold">
          <ZapIcon className="size-4 text-orange-400" />
          <span className="text-sm">Mote LAB Owner</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { label: "Overview", href: "/owner", icon: LayoutDashboardIcon },
            { label: "Users", href: "/owner/users", icon: UsersIcon },
            { label: "Subscriptions", href: "/owner/subscriptions", icon: CreditCardIcon },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="size-4" />
            Ke Dashboard
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center px-6">
          <h1 className="font-semibold text-slate-900">Owner Panel</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
