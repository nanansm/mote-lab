export type UserRole = "user" | "owner";

export type SubscriptionPlan = "trial" | "starter" | "pro" | "lifetime";

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  ipaymuInvoiceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageQuota {
  id: string;
  userId: string;
  date: string;
  researchCount: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, { dailyLimit: number; historyDays: number }> = {
  trial: { dailyLimit: 100, historyDays: 7 },
  starter: { dailyLimit: 500, historyDays: 30 },
  pro: { dailyLimit: 999999, historyDays: 90 },
  lifetime: { dailyLimit: 999999, historyDays: 90 },
};

export const PLAN_PRICES: Record<Exclude<SubscriptionPlan, "trial">, number> = {
  starter: 99000,
  pro: 199000,
  lifetime: 1999000,
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  trial: "Free Trial",
  starter: "Starter",
  pro: "Pro",
  lifetime: "Lifetime",
};
