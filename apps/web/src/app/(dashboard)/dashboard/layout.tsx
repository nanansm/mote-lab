import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { PLAN_LIMITS } from "@mote-lab/shared";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // Fetch quota for sidebar
  const now = new Date();
  const wibDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const todayWIB = wibDate.toISOString().split("T")[0]!;

  const [quota, subscription] = await Promise.all([
    db.query.usageQuota.findFirst({
      where: and(
        eq(schema.usageQuota.userId, session.user.id),
        eq(schema.usageQuota.date, todayWIB),
      ),
    }),
    db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.userId, session.user.id),
      orderBy: [desc(schema.subscriptions.createdAt)],
    }),
  ]);

  const plan = subscription?.plan ?? "trial";
  const limits = PLAN_LIMITS as Record<string, { dailyLimit: number }>;
  const quotaLimit = limits[plan]?.dailyLimit ?? 100;
  const quotaUsed = quota?.researchCount ?? 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar className="hidden lg:flex" quotaUsed={quotaUsed} quotaLimit={quotaLimit} plan={plan} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
