import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import { updateProfileRequestSchema } from "@caloriehero/shared-types";
import { requireAuth } from "../../middleware/require-auth.js";
import * as userService from "../../services/user-service.js";
import * as profileService from "../../services/profile-service.js";

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/users/me — authenticated
  fastify.get(
    "/api/v1/users/me",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const user = await userService.getUser(fastify.db, request.user!.id);
      if (!user) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "User not found" },
        });
      }
      return user;
    }
  );

  // GET /api/v1/users/me/profile — authenticated
  fastify.get(
    "/api/v1/users/me/profile",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const profile = await profileService.getProfile(
        fastify.db,
        request.user!.id
      );
      if (!profile) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Profile not found" },
        });
      }
      return profile;
    }
  );

  // PUT /api/v1/users/me/profile — authenticated
  fastify.put(
    "/api/v1/users/me/profile",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      let parsed;
      try {
        parsed = updateProfileRequestSchema.parse(request.body);
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

      const profile = await profileService.upsertProfile(
        fastify.db,
        request.user!.id,
        parsed
      );
      return reply.status(200).send(profile);
    }
  );
};

export default fp(userRoutes, {
  name: "user-routes",
  fastify: "5.x",
});
