import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import { createSubscriptionRequestSchema } from "@caloriehero/shared-types";
import { requireAuth } from "../../middleware/require-auth.js";
import * as subscriptionService from "../../services/subscription-service.js";

const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/subscriptions — create
  fastify.post(
    "/api/v1/subscriptions",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      let parsed;
      try {
        parsed = createSubscriptionRequestSchema.parse(request.body);
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

      const subscription = await subscriptionService.createSubscription(
        fastify.db,
        request.user!.id,
        {
          schedule: parsed.schedule,
          macroTargets: parsed.macroTargets,
        }
      );

      return reply.status(201).send(subscription);
    }
  );

  // GET /api/v1/subscriptions — list mine
  fastify.get(
    "/api/v1/subscriptions",
    { preHandler: [requireAuth] },
    async (request) => {
      const subs = await subscriptionService.listUserSubscriptions(
        fastify.db,
        request.user!.id
      );
      return { subscriptions: subs };
    }
  );

  // GET /api/v1/subscriptions/:id
  fastify.get<{ Params: { id: string } }>(
    "/api/v1/subscriptions/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const sub = await subscriptionService.getSubscription(
        fastify.db,
        request.params.id
      );

      if (!sub) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Subscription not found" },
        });
      }

      if (sub.userId !== request.user!.id && !request.user!.isAdmin) {
        return reply.status(403).send({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
      }

      return sub;
    }
  );

  // PATCH /api/v1/subscriptions/:id/pause
  fastify.patch<{ Params: { id: string } }>(
    "/api/v1/subscriptions/:id/pause",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const existing = await subscriptionService.getSubscription(
        fastify.db,
        request.params.id
      );

      if (!existing) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Subscription not found" },
        });
      }

      if (existing.userId !== request.user!.id && !request.user!.isAdmin) {
        return reply.status(403).send({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
      }

      const sub = await subscriptionService.pauseSubscription(
        fastify.db,
        request.params.id
      );

      return sub;
    }
  );

  // PATCH /api/v1/subscriptions/:id/resume
  fastify.patch<{ Params: { id: string } }>(
    "/api/v1/subscriptions/:id/resume",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const existing = await subscriptionService.getSubscription(
        fastify.db,
        request.params.id
      );

      if (!existing) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Subscription not found" },
        });
      }

      if (existing.userId !== request.user!.id && !request.user!.isAdmin) {
        return reply.status(403).send({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
      }

      const sub = await subscriptionService.resumeSubscription(
        fastify.db,
        request.params.id
      );

      return sub;
    }
  );

  // PATCH /api/v1/subscriptions/:id/cancel
  fastify.patch<{ Params: { id: string } }>(
    "/api/v1/subscriptions/:id/cancel",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const existing = await subscriptionService.getSubscription(
        fastify.db,
        request.params.id
      );

      if (!existing) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Subscription not found" },
        });
      }

      if (existing.userId !== request.user!.id && !request.user!.isAdmin) {
        return reply.status(403).send({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
      }

      const sub = await subscriptionService.cancelSubscription(
        fastify.db,
        request.params.id
      );

      return sub;
    }
  );
};

export default fp(subscriptionRoutes, {
  name: "subscription-routes",
  fastify: "5.x",
});
