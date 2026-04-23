import { z } from "zod";

export const subscriptionPlanSchema = z.enum(["trial", "starter", "pro", "lifetime"]);

export const subscriptionStatusSchema = z.enum(["active", "expired", "cancelled"]);

export const createSubscriptionSchema = z.object({
  userId: z.string(),
  plan: subscriptionPlanSchema,
  trialEndsAt: z.date().optional(),
  currentPeriodEnd: z.date().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
