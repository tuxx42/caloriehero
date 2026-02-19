import type { FastifyRequest, FastifyReply } from "fastify";

/**
 * Fastify preHandler that rejects non-admin requests with 403.
 * Must be used after requireAuth (assumes request.user is set).
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  }

  if (!request.user.isAdmin) {
    return reply.status(403).send({
      error: {
        code: "FORBIDDEN",
        message: "Admin privileges required",
      },
    });
  }
}
