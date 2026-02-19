import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

const requestLoggerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onResponse", (request, reply, done) => {
    if (request.url === "/health" || request.url === "/ready") {
      done();
      return;
    }

    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      "request completed",
    );
    done();
  });
};

export const requestLoggerPluginWrapped = fp(requestLoggerPlugin, {
  name: "request-logger",
  fastify: "5.x",
});
