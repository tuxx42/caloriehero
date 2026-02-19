import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import { createOrderRequestSchema } from "@caloriehero/shared-types";
import { requireAuth } from "../../middleware/require-auth.js";
import * as orderService from "../../services/order-service.js";
import * as paymentService from "../../services/payment-service.js";

const orderRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/orders — create order
  fastify.post(
    "/api/v1/orders",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      let parsed;
      try {
        parsed = createOrderRequestSchema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              message: "Request validation failed",
              details: err.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          });
        }
        throw err;
      }

      const order = await orderService.createOrder(
        fastify.db,
        request.user!.id,
        {
          items: parsed.items,
          deliverySlotId: parsed.deliverySlotId,
          deliveryAddress: parsed.deliveryAddress,
        }
      );

      return reply.status(201).send(order);
    }
  );

  // GET /api/v1/orders — list my orders
  fastify.get(
    "/api/v1/orders",
    { preHandler: [requireAuth] },
    async (request) => {
      const userOrders = await orderService.listUserOrders(
        fastify.db,
        request.user!.id
      );
      return { orders: userOrders };
    }
  );

  // GET /api/v1/orders/:id — get order
  fastify.get<{ Params: { id: string } }>(
    "/api/v1/orders/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const order = await orderService.getOrder(fastify.db, request.params.id);

      if (!order) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Order not found" },
        });
      }

      // Ensure users can only see their own orders
      if (order.userId !== request.user!.id && !request.user!.isAdmin) {
        return reply.status(403).send({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
      }

      return order;
    }
  );

  // POST /api/v1/orders/:id/pay — create payment intent
  fastify.post<{ Params: { id: string } }>(
    "/api/v1/orders/:id/pay",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const order = await orderService.getOrder(fastify.db, request.params.id);

      if (!order) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Order not found" },
        });
      }

      if (order.userId !== request.user!.id && !request.user!.isAdmin) {
        return reply.status(403).send({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
      }

      // Build payment provider from config
      const stripeKey = (fastify as { stripeSecretKey?: string })
        .stripeSecretKey;
      if (!stripeKey) {
        throw new Error("Stripe secret key not configured");
      }

      const provider = paymentService.createStripeProvider(stripeKey);
      const result = await paymentService.createPaymentForOrder(
        fastify.db,
        provider,
        request.params.id
      );

      return reply.status(200).send(result);
    }
  );
};

export default fp(orderRoutes, {
  name: "order-routes",
  fastify: "5.x",
});
