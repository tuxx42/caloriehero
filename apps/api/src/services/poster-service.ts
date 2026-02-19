import { eq } from "drizzle-orm";
import type { Database } from "../db/index.js";
import {
  orders,
  orderItems,
  meals,
} from "../db/schema/index.js";

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface PosterProvider {
  createIncomingOrder(params: {
    products: Array<{ productId: string; count: number }>;
    comment?: string;
  }): Promise<{ incomingOrderId: string }>;
  getIncomingOrder(id: string): Promise<{ status: string }>;
}

// ---------------------------------------------------------------------------
// Real Poster provider
// ---------------------------------------------------------------------------

export function createRealPosterProvider(
  apiUrl: string,
  accessToken: string
): PosterProvider {
  return {
    async createIncomingOrder(params) {
      const url = `${apiUrl}/incomingOrders.createIncomingOrder?token=${accessToken}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spot_id: 1,
          products: params.products.map((p) => ({
            product_id: p.productId,
            count: p.count,
          })),
          comment: params.comment,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Poster API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as {
        response?: { incoming_order_id?: string };
      };
      const incomingOrderId = data.response?.incoming_order_id;
      if (!incomingOrderId) {
        throw new Error("Poster did not return incoming_order_id");
      }

      return { incomingOrderId };
    },

    async getIncomingOrder(id) {
      const url = `${apiUrl}/incomingOrders.getIncomingOrder?token=${accessToken}&incoming_order_id=${id}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Poster API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as {
        response?: { status?: string };
      };
      const status = data.response?.status ?? "unknown";
      return { status };
    },
  };
}

// ---------------------------------------------------------------------------
// Mock Poster provider for tests
// ---------------------------------------------------------------------------

export interface MockPosterProvider extends PosterProvider {
  setOrderStatus(id: string, status: string): void;
}

export function createMockPosterProvider(): MockPosterProvider {
  let counter = 1;
  const statusStore = new Map<string, string>();

  return {
    async createIncomingOrder(_params) {
      const incomingOrderId = `poster_mock_${counter++}`;
      statusStore.set(incomingOrderId, "new");
      return { incomingOrderId };
    },

    async getIncomingOrder(id) {
      const status = statusStore.get(id) ?? "new";
      return { status };
    },

    setOrderStatus(id, status) {
      statusStore.set(id, status);
    },
  };
}

// ---------------------------------------------------------------------------
// Poster status → internal order status mapping
// ---------------------------------------------------------------------------

function mapPosterStatus(posterStatus: string): string {
  switch (posterStatus) {
    case "new":
      return "preparing";
    case "accepted":
      return "preparing";
    case "in_progress":
      return "preparing";
    case "done":
      return "ready";
    case "delivering":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "preparing";
  }
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function pushOrderToPoster(
  db: Database,
  provider: PosterProvider,
  orderId: string
) {
  // 1. Get order with items
  const [orderRow] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRow) {
    throw Object.assign(new Error("Order not found"), {
      statusCode: 404,
      code: "NOT_FOUND",
    });
  }

  // Resolve posterProductIds for each order item's meal
  const itemRows = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const products: Array<{ productId: string; count: number }> = [];

  for (const item of itemRows) {
    const [mealRow] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, item.mealId))
      .limit(1);

    if (!mealRow?.posterProductId) {
      throw Object.assign(
        new Error(`Meal ${item.mealId} has no posterProductId`),
        { statusCode: 400, code: "MISSING_POSTER_PRODUCT_ID" }
      );
    }

    products.push({ productId: mealRow.posterProductId, count: item.quantity });
  }

  // 2. Call provider.createIncomingOrder()
  const { incomingOrderId } = await provider.createIncomingOrder({ products });

  // 3. Update order with posterOrderId and status = "preparing"
  await db
    .update(orders)
    .set({
      posterOrderId: incomingOrderId,
      status: "preparing",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  return incomingOrderId;
}

export async function pollPosterOrderStatus(
  db: Database,
  provider: PosterProvider,
  orderId: string
) {
  // 1. Get order's posterOrderId
  const [orderRow] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRow) {
    throw Object.assign(new Error("Order not found"), {
      statusCode: 404,
      code: "NOT_FOUND",
    });
  }

  if (!orderRow.posterOrderId) {
    throw Object.assign(new Error("Order has no posterOrderId"), {
      statusCode: 400,
      code: "NO_POSTER_ORDER_ID",
    });
  }

  // 2. Call provider.getIncomingOrder()
  const { status: posterStatus } = await provider.getIncomingOrder(
    orderRow.posterOrderId
  );

  // 3. Map Poster status to order status
  const newStatus = mapPosterStatus(posterStatus);

  // 4. Update order status if changed
  const changed = newStatus !== orderRow.status;

  if (changed) {
    await db
      .update(orders)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }

  // 5. Return
  return { changed, newStatus };
}
