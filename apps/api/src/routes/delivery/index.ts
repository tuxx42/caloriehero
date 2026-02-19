import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import * as deliveryService from "../../services/delivery-service.js";

const deliveryRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/delivery/zones — public
  fastify.get("/api/v1/delivery/zones", async () => {
    const zones = await deliveryService.listDeliveryZones(fastify.db);
    return { zones };
  });

  // GET /api/v1/delivery/slots — public (query: zoneId, date)
  fastify.get("/api/v1/delivery/slots", async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const { zoneId, date } = query;

    if (!zoneId || !date) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "zoneId and date query parameters are required",
        },
      });
    }

    const slots = await deliveryService.listAvailableSlots(
      fastify.db,
      zoneId,
      date
    );
    return { slots };
  });
};

export default fp(deliveryRoutes, {
  name: "delivery-routes",
  fastify: "5.x",
});
