import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, session.user.id),
    orderBy: [desc(schema.subscriptions.createdAt)],
  });

  const currentPlan = subscription?.plan ?? "trial";
  const planStatus = subscription?.status ?? "active";
  const isLifetime = currentPlan === "lifetime";

  // Expiry: trial → trialEndsAt, starter/pro → currentPeriodEnd, lifetime → null
  const expiryDate =
    isLifetime
      ? null
      : currentPlan === "trial"
        ? (subscription?.trialEndsAt?.toISOString() ?? null)
        : (subscription?.currentPeriodEnd?.toISOString() ?? null);

  return (
    <BillingClient
      currentPlan={currentPlan}
      planStatus={planStatus}
      expiryDate={expiryDate}
      isLifetime={isLifetime}
    />
  );
}
