import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import Redis from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
    redisPub: Redis;
    redisSub: Redis;
  }
}

export interface RedisPluginOptions {
  redisUrl: string;
}

const redisPlugin: FastifyPluginAsync<RedisPluginOptions> = async (
  fastify,
  opts
) => {
  const redis = new Redis(opts.redisUrl);
  const redisPub = new Redis(opts.redisUrl);
  const redisSub = new Redis(opts.redisUrl);

  fastify.decorate("redis", redis);
  fastify.decorate("redisPub", redisPub);
  fastify.decorate("redisSub", redisSub);

  fastify.addHook("onClose", async () => {
    await redis.quit();
    await redisPub.quit();
    await redisSub.quit();
  });
};

export const redisPluginWrapped = fp(redisPlugin, {
  name: "redis",
  fastify: "5.x",
});
