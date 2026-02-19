import { eq, and } from "drizzle-orm";
import type { Database } from "../db/index.js";
import {
  orders,
  orderItems,
  meals,
  type OrderRow,
  type OrderItemRow,
} from "../db/schema/index.js";

export interface CreateOrderData {
  items: Array<{ mealId: string; quantity: number }>;
  deliverySlotId?: string;
  deliveryAddress?: string;
}

function rowToOrder(row: OrderRow, items: OrderItemRow[]) {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    type: row.type,
    total: row.total,
    deliverySlotId: row.deliverySlotId ?? undefined,
    deliveryAddress: row.deliveryAddress ?? undefined,
    posterOrderId: row.posterOrderId ?? undefined,
    stripePaymentIntentId: row.stripePaymentIntentId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      mealId: item.mealId,
      mealName: item.mealName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}

export async function createOrder(
  db: Database,
  userId: string,
  data: CreateOrderData
) {
  // 1. Validate all mealIds exist and are active
  const mealIds = data.items.map((i) => i.mealId);
  const mealRows = await db
    .select()
    .from(meals)
    .where(eq(meals.active, true));

  const activeMealMap = new Map(mealRows.map((m) => [m.id, m]));

  for (const item of data.items) {
    if (!activeMealMap.has(item.mealId)) {
      throw Object.assign(
        new Error(`Meal not found or inactive: ${item.mealId}`),
        { statusCode: 400, code: "INVALID_MEAL" }
      );
    }
  }

  // 2. Calculate total
  let total = 0;
  for (const item of data.items) {
    const meal = activeMealMap.get(item.mealId)!;
    total += meal.price * item.quantity;
  }

  // 3. Insert order
  const [orderRow] = await db
    .insert(orders)
    .values({
      userId,
      status: "pending_payment",
      type: data.deliverySlotId ? "delivery" : "pickup",
      total,
      deliverySlotId: data.deliverySlotId ?? null,
      deliveryAddress: data.deliveryAddress ?? null,
    })
    .returning();

  if (!orderRow) throw new Error("Failed to create order");

  // 4. Insert order items
  const itemValues = data.items.map((item) => {
    const meal = activeMealMap.get(item.mealId)!;
    return {
      orderId: orderRow.id,
      mealId: item.mealId,
      mealName: meal.name,
      quantity: item.quantity,
      unitPrice: meal.price,
    };
  });

  const insertedItems = await db
    .insert(orderItems)
    .values(itemValues)
    .returning();

  return rowToOrder(orderRow, insertedItems);
}

export async function getOrder(db: Database, orderId: string) {
  const [orderRow] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRow) return null;

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return rowToOrder(orderRow, itemRows);
}

export async function listUserOrders(db: Database, userId: string) {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(orders.createdAt);

  const results = [];
  for (const orderRow of orderRows) {
    const itemRows = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderRow.id));
    results.push(rowToOrder(orderRow, itemRows));
  }

  return results;
}

export async function updateOrderStatus(
  db: Database,
  orderId: string,
  status: string
) {
  const [row] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  if (!row) return null;

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return rowToOrder(row, itemRows);
}

export async function setOrderPosterOrderId(
  db: Database,
  orderId: string,
  posterOrderId: string
) {
  const [row] = await db
    .update(orders)
    .set({ posterOrderId, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  if (!row) return null;

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return rowToOrder(row, itemRows);
}

export async function setOrderStripePaymentIntentId(
  db: Database,
  orderId: string,
  stripePaymentIntentId: string
) {
  const [row] = await db
    .update(orders)
    .set({ stripePaymentIntentId, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  if (!row) return null;

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return rowToOrder(row, itemRows);
}
