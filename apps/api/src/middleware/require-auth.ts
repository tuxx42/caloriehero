import type { FastifyRequest, FastifyReply } from "fastify";

/**
 * Fastify preHandler that rejects unauthenticated requests with 401.
 * Register on routes or route prefixes that require a logged-in user.
 */
export async function requireAuth(
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
}
