import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { createDb, type Database } from "../db/index.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

export interface DatabasePluginOptions {
  databaseUrl: string;
}

const databasePlugin: FastifyPluginAsync<DatabasePluginOptions> = async (
  fastify,
  opts
) => {
  const db = createDb(opts.databaseUrl);
  fastify.decorate("db", db);
};

export const dbPlugin = fp(databasePlugin, {
  name: "database",
  fastify: "5.x",
});
