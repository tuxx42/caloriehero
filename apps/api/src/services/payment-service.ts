import { eq } from "drizzle-orm";
import Stripe from "stripe";
import type { Database } from "../db/index.js";
import {
  paymentIntents,
  orders,
  type PaymentIntentRow,
} from "../db/schema/index.js";

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface PaymentProvider {
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>
  ): Promise<{ id: string; clientSecret: string }>;
  constructWebhookEvent(
    body: string,
    signature: string,
    secret: string
  ): unknown;
}

// ---------------------------------------------------------------------------
// Real Stripe provider
// ---------------------------------------------------------------------------

export function createStripeProvider(secretKey: string): PaymentProvider {
  const stripe = new Stripe(secretKey);

  return {
    async createPaymentIntent(amount, currency, metadata) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // convert to smallest currency unit
        currency,
        metadata,
        automatic_payment_methods: { enabled: true },
      });

      if (!intent.client_secret) {
        throw new Error("Stripe did not return a client_secret");
      }

      return { id: intent.id, clientSecret: intent.client_secret };
    },

    constructWebhookEvent(body, signature, secret) {
      return stripe.webhooks.constructEvent(body, signature, secret);
    },
  };
}

// ---------------------------------------------------------------------------
// Mock provider for tests
// ---------------------------------------------------------------------------

export interface MockPaymentProvider extends PaymentProvider {
  simulatePaymentSuccess(paymentIntentId: string): void;
}

export function createMockPaymentProvider(): MockPaymentProvider {
  const store = new Map<string, string>(); // id -> status

  return {
    async createPaymentIntent(amount, currency, metadata) {
      const id = `pi_mock_${Date.now()}`;
      const clientSecret = `${id}_secret_mock`;
      store.set(id, "pending");
      return { id, clientSecret };
    },

    constructWebhookEvent(body, _signature, _secret) {
      return JSON.parse(body);
    },

    simulatePaymentSuccess(paymentIntentId) {
      store.set(paymentIntentId, "succeeded");
    },
  };
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function createPaymentForOrder(
  db: Database,
  provider: PaymentProvider,
  orderId: string
) {
  // 1. Get order
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

  // 2. Create Stripe PaymentIntent
  const { id: stripePaymentIntentId, clientSecret } =
    await provider.createPaymentIntent(orderRow.total, "thb", {
      orderId,
      userId: orderRow.userId,
    });

  // 3. Insert payment_intents row
  await db.insert(paymentIntents).values({
    stripePaymentIntentId,
    amount: orderRow.total,
    currency: "thb",
    status: "pending",
    orderId,
  });

  // 4. Update order with stripePaymentIntentId
  await db
    .update(orders)
    .set({ stripePaymentIntentId, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // 5. Return
  return { clientSecret, paymentIntentId: stripePaymentIntentId };
}

export async function handlePaymentSuccess(
  db: Database,
  stripePaymentIntentId: string
) {
  // 1. Find payment_intent by stripePaymentIntentId
  const [paymentRow] = await db
    .select()
    .from(paymentIntents)
    .where(eq(paymentIntents.stripePaymentIntentId, stripePaymentIntentId))
    .limit(1);

  if (!paymentRow) {
    throw Object.assign(new Error("Payment intent not found"), {
      statusCode: 404,
      code: "NOT_FOUND",
    });
  }

  // 2. Update payment status to "succeeded"
  await db
    .update(paymentIntents)
    .set({ status: "succeeded" })
    .where(eq(paymentIntents.stripePaymentIntentId, stripePaymentIntentId));

  // 3. Update order status to "confirmed"
  await db
    .update(orders)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(orders.id, paymentRow.orderId));

  // 4. Return orderId so caller can push to POS
  return paymentRow.orderId;
}
