import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import {
  matchMealsRequestSchema,
  generatePlanRequestSchema,
} from "@caloriehero/shared-types";
import { requireAuth } from "../../middleware/require-auth.js";
import * as planService from "../../services/plan-service.js";

const matchingRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/matching/meals — authenticated
  fastify.post(
    "/api/v1/matching/meals",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      let parsed;
      try {
        parsed = matchMealsRequestSchema.parse(request.body);
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

      const results = await planService.matchMealsForUser(
        fastify.db,
        request.user!.id,
        { category: parsed.category, limit: parsed.limit }
      );

      return { meals: results };
    }
  );

  // POST /api/v1/matching/plan — authenticated
  fastify.post(
    "/api/v1/matching/plan",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      let parsed;
      try {
        parsed = generatePlanRequestSchema.parse(request.body);
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

      const result = await planService.generatePlanForUser(
        fastify.db,
        request.user!.id,
        { date: parsed.date, slots: parsed.slots }
      );

      if (!result) {
        return reply.status(404).send({
          error: {
            code: "NO_PLAN_POSSIBLE",
            message: "Could not generate a plan with available meals",
          },
        });
      }

      return result;
    }
  );
};

export default fp(matchingRoutes, {
  name: "matching-routes",
  fastify: "5.x",
});
