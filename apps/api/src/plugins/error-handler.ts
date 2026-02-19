import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details = error.errors.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details,
        },
      });
    }

    // Handle application-level HTTP errors (e.g. thrown with statusCode)
    const statusCode =
      (error as { statusCode?: number }).statusCode ??
      (error as { status?: number }).status ??
      500;

    const code =
      (error as { code?: string }).code ?? "INTERNAL_SERVER_ERROR";

    fastify.log.error(error);

    return reply.status(statusCode).send({
      error: {
        code: String(code),
        message: (error as Error).message ?? "An unexpected error occurred",
      },
    });
  });
};

export const errorHandlerPluginWrapped = fp(errorHandlerPlugin, {
  name: "error-handler",
  fastify: "5.x",
});
