import { db, schema } from "@mote-lab/db";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon } from "lucide-react";
import { UsersTable, type UserRow } from "./users-table";

export const metadata = { title: "Users — Owner Panel" };

export default async function OwnerUsersPage() {
  const [allUsers, allSubs] = await Promise.all([
    db.select().from(schema.users).orderBy(desc(schema.users.createdAt)),
    db
      .select()
      .from(schema.subscriptions)
      .orderBy(desc(schema.subscriptions.createdAt)),
  ]);

  // Latest subscription per user (array is already sorted desc, first = latest)
  const latestSubByUserId = new Map<string, (typeof allSubs)[0]>();
  for (const sub of allSubs) {
    if (!latestSubByUserId.has(sub.userId)) {
      latestSubByUserId.set(sub.userId, sub);
    }
  }

  // Serialize dates for RSC → client component boundary
  const users: UserRow[] = allUsers.map((user) => {
    const sub = latestSubByUserId.get(user.id) ?? null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      subscription: sub
        ? {
            id: sub.id,
            plan: sub.plan,
            status: sub.status,
            trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
            currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          }
        : null,
    };
  });

  const totalUsers = users.length;
  const activeTrials = users.filter((u) => u.subscription?.plan === "trial" && u.subscription.status === "active").length;
  const paidActive = users.filter(
    (u) =>
      u.subscription?.status === "active" &&
      u.subscription.plan !== "trial" &&
      u.role !== "owner"
  ).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manajemen Users</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Kelola plan dan subscription semua user.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Users", value: totalUsers, icon: UsersIcon, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Trial Aktif", value: activeTrials, icon: UsersIcon, color: "text-yellow-600", bg: "bg-yellow-100" },
          { label: "Paid Aktif", value: paidActive, icon: UsersIcon, color: "text-green-600", bg: "bg-green-100" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`size-4 ${s.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Users</CardTitle>
          <CardDescription>
            Klik "Ganti Plan" untuk mengubah subscription, atau extend/cancel langsung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
