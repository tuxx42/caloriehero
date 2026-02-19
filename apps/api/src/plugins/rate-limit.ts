import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type { FastifyPluginAsync } from "fastify";

export interface RateLimitOptions {
  /** Max requests per window (default: 100). */
  max?: number;
  /** Window duration in ms (default: 60000 = 1 minute). */
  timeWindow?: number;
}

const rateLimitPlugin: FastifyPluginAsync<RateLimitOptions> = async (
  fastify,
  opts,
) => {
  await fastify.register(rateLimit, {
    max: opts.max ?? 100,
    timeWindow: opts.timeWindow ?? 60_000,
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    }),
  });
};

export const rateLimitPluginWrapped = fp(rateLimitPlugin, {
  name: "rate-limit",
  fastify: "5.x",
});
