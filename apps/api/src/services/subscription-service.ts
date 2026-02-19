import { eq } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { subscriptions, type SubscriptionRow } from "../db/schema/index.js";

function rowToSubscription(row: SubscriptionRow) {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    stripeSubscriptionId: row.stripeSubscriptionId ?? undefined,
    schedule: row.schedule as {
      days: string[];
      timeSlot: string;
      mealsPerDay: number;
    },
    macroTargets: row.macroTargets as {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pausedAt: row.pausedAt ?? undefined,
    cancelledAt: row.cancelledAt ?? undefined,
  };
}

export async function createSubscription(
  db: Database,
  userId: string,
  data: { schedule: object; macroTargets: object }
) {
  const [row] = await db
    .insert(subscriptions)
    .values({
      userId,
      status: "active",
      schedule: data.schedule,
      macroTargets: data.macroTargets,
    })
    .returning();

  if (!row) throw new Error("Failed to create subscription");
  return rowToSubscription(row);
}

export async function getSubscription(
  db: Database,
  subscriptionId: string
) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  if (!row) return null;
  return rowToSubscription(row);
}

export async function listUserSubscriptions(db: Database, userId: string) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.createdAt);

  return rows.map(rowToSubscription);
}

export async function pauseSubscription(
  db: Database,
  subscriptionId: string
) {
  const [row] = await db
    .update(subscriptions)
    .set({ status: "paused", pausedAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();

  if (!row) return null;
  return rowToSubscription(row);
}

export async function resumeSubscription(
  db: Database,
  subscriptionId: string
) {
  const [row] = await db
    .update(subscriptions)
    .set({ status: "active", pausedAt: null, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();

  if (!row) return null;
  return rowToSubscription(row);
}

export async function cancelSubscription(
  db: Database,
  subscriptionId: string
) {
  const [row] = await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();

  if (!row) return null;
  return rowToSubscription(row);
}
