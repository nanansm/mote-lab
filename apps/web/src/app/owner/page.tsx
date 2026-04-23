import { db, schema } from "@mote-lab/db";
import { eq, desc, count, and, gte } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UsersIcon, CreditCardIcon, TrendingUpIcon, ClockIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PLAN_LABELS } from "@mote-lab/shared";

const PLAN_PRICES: Record<string, number> = {
  starter: 99000,
  pro: 199000,
  lifetime: 1999000,
};

export default async function OwnerPage() {
  const [totalUsers, activeSubscriptions, recentUsers, recentSubscriptions] = await Promise.all([
    db.select({ count: count() }).from(schema.users),
    db
      .select({ count: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, "active")),
    db.query.users.findMany({
      orderBy: desc(schema.users.createdAt),
      limit: 50,
    }),
    db.query.subscriptions.findMany({
      orderBy: desc(schema.subscriptions.createdAt),
      limit: 50,
      with: {
        user: { columns: { name: true, email: true } },
      } as never,
    }),
  ]);

  const totalUserCount = totalUsers[0]?.count ?? 0;
  const activeSubCount = activeSubscriptions[0]?.count ?? 0;

  // Calculate MRR from active non-trial subscriptions
  const paidSubs = await db.query.subscriptions.findMany({
    where: and(
      eq(schema.subscriptions.status, "active"),
      gte(schema.subscriptions.plan, "starter")
    ),
  });

  const mrr = paidSubs.reduce((sum, sub) => {
    if (sub.plan === "lifetime") return sum; // Lifetime doesn't count as monthly
    return sum + (PLAN_PRICES[sub.plan] ?? 0);
  }, 0);

  const trialCount = recentSubscriptions.filter((s) => s.plan === "trial").length;

  const stats = [
    {
      label: "Total Users",
      value: totalUserCount.toLocaleString("id-ID"),
      icon: UsersIcon,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Active Subscriptions",
      value: activeSubCount.toLocaleString("id-ID"),
      icon: CreditCardIcon,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "MRR",
      value: `Rp ${(mrr / 1000).toFixed(0)}K`,
      icon: TrendingUpIcon,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      label: "Trial Users",
      value: trialCount.toLocaleString("id-ID"),
      icon: ClockIcon,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-600 mt-1 text-sm">Summary data Mote LAB.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600">{stat.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`size-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registrasi Terbaru</CardTitle>
          <CardDescription>50 user terakhir yang bergabung</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Bergabung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                    Belum ada user
                  </TableCell>
                </TableRow>
              ) : (
                recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "owner" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Langganan Terbaru</CardTitle>
          <CardDescription>50 subscription terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                    Belum ada subscription
                  </TableCell>
                </TableRow>
              ) : (
                recentSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium capitalize">
                      {PLAN_LABELS[sub.plan as keyof typeof PLAN_LABELS] ?? sub.plan}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sub.status === "active" ? "default" : "secondary"}
                        className={`text-xs ${sub.status === "active" ? "bg-green-100 text-green-700 border-green-200" : ""}`}
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {sub.trialEndsAt ? formatDate(sub.trialEndsAt) : "-"}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {formatDate(sub.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
