import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../middleware/require-auth.js";
import { SSEManager } from "../../realtime/sse-manager.js";
import * as orderService from "../../services/order-service.js";

/**
 * Shared SSEManager instance used by this route plugin.
 * Exported so it can be injected or accessed in tests.
 */
export const sseManager = new SSEManager();

const sseRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/sse/orders/:orderId
   *
   * Establishes a long-lived SSE connection for tracking order status updates.
   * The authenticated user must own the order.
   *
   * Response headers:
   *   Content-Type: text/event-stream
   *   Cache-Control: no-cache
   *   Connection: keep-alive
   *   X-Accel-Buffering: no
   *
   * Events:
   *   event: status
   *   data: { orderId, status }
   */
  fastify.get<{ Params: { orderId: string } }>(
    "/api/v1/sse/orders/:orderId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { orderId } = request.params;
      const userId = request.user!.id;

      // Verify the order exists and is owned by the authenticated user
      const order = await orderService.getOrder(fastify.db, orderId);

      if (!order) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Order not found" },
        });
      }

      if (order.userId !== userId) {
        return reply.status(403).send({
          error: {
            code: "FORBIDDEN",
            message: "You do not have access to this order",
          },
        });
      }

      // Set SSE response headers and take over the raw socket
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      // Send the current status immediately so the client has initial state
      reply.raw.write(
        `event: status\ndata: ${JSON.stringify({ orderId, status: order.status })}\n\n`
      );

      // Register connection so future Redis pub/sub messages reach this client
      sseManager.addConnection(orderId, { reply, userId, orderId });

      // Clean up when the client disconnects
      request.raw.on("close", () => {
        sseManager.removeConnection(orderId, reply);
      });

      // Return a promise that never resolves so Fastify keeps the connection open
      return new Promise<void>(() => undefined);
    }
  );
};

export default fp(sseRoutes, {
  name: "sse-routes",
  fastify: "5.x",
});
