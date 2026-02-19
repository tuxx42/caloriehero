import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async () => {
    return { status: "ok" };
  });

  fastify.get("/ready", async (_request, reply) => {
    // In a full implementation this would check DB connectivity etc.
    return reply.status(200).send({ status: "ready" });
  });
};

export default fp(healthRoutes, {
  name: "health-routes",
  fastify: "5.x",
});
