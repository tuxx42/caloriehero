import Fastify from "fastify";
import cors from "@fastify/cors";
import { authPlugin, mockAuthPluginWrapped } from "./plugins/auth.js";
import { dbPlugin } from "./plugins/database.js";
import { redisPluginWrapped } from "./plugins/redis.js";
import { errorHandlerPluginWrapped } from "./plugins/error-handler.js";
import { rateLimitPluginWrapped } from "./plugins/rate-limit.js";
import { requestLoggerPluginWrapped } from "./plugins/request-logger.js";
import healthRoutes from "./routes/health/index.js";
import mealRoutes from "./routes/meals/index.js";
import userRoutes from "./routes/users/index.js";
import matchingRoutes from "./routes/matching/index.js";
import orderRoutes from "./routes/orders/index.js";
import subscriptionRoutes from "./routes/subscriptions/index.js";
import deliveryRoutes from "./routes/delivery/index.js";
import stripeWebhookRoutes from "./routes/webhooks/stripe.js";
import sseRoutes from "./routes/sse/index.js";
import type { Database } from "./db/index.js";
import type Redis from "ioredis";

export interface BuildAppOptions {
  /** Use mock auth plugin for tests (accepts plain JSON tokens). */
  useMockAuth?: boolean;
  /** JWT secret used when useMockAuth is false. */
  jwtSecret?: string;
  /** Provide a pre-configured DB instance (used in tests). */
  db?: Database;
  /** DATABASE_URL used when db is not provided. */
  databaseUrl?: string;
  /** Provide pre-configured Redis instances (used in tests). */
  redis?: Redis;
  redisPub?: Redis;
  redisSub?: Redis;
  /** REDIS_URL used when redis is not provided. */
  redisUrl?: string;
  /** Stripe secret key. */
  stripeSecretKey?: string;
  /** Stripe webhook secret. */
  stripeWebhookSecret?: string;
  /** Disable logging in tests. */
  logger?: boolean;
  /** Enable rate limiting (disabled in tests by default). */
  enableRateLimit?: boolean;
}

export function buildApp(opts: BuildAppOptions = {}) {
  const {
    useMockAuth = false,
    jwtSecret,
    db,
    databaseUrl,
    redis,
    redisPub,
    redisSub,
    redisUrl,
    stripeSecretKey,
    stripeWebhookSecret,
    logger = false,
    enableRateLimit = false,
  } = opts;

  const app = Fastify({ logger });

  // CORS
  app.register(cors, { origin: true });

  // Error handler
  app.register(errorHandlerPluginWrapped);

  // Rate limiting (disabled in tests)
  if (enableRateLimit) {
    app.register(rateLimitPluginWrapped);
  }

  // Request logger
  if (logger) {
    app.register(requestLoggerPluginWrapped);
  }

  // Auth
  if (useMockAuth) {
    app.register(mockAuthPluginWrapped);
  } else {
    app.register(authPlugin, { jwtSecret });
  }

  // Database — either inject a pre-built instance or create from URL
  if (db) {
    app.decorate("db", db);
  } else if (databaseUrl) {
    app.register(dbPlugin, { databaseUrl });
  }
  // If neither is provided, routes requiring `fastify.db` will throw at runtime.

  // Redis — either inject pre-built instances or create from URL
  if (redis) {
    app.decorate("redis", redis);
    app.decorate("redisPub", redisPub ?? redis);
    app.decorate("redisSub", redisSub ?? redis);
  } else if (redisUrl) {
    app.register(redisPluginWrapped, { redisUrl });
  }

  // Stripe config — decorate so routes can access without importing config
  if (stripeSecretKey) {
    app.decorate("stripeSecretKey", stripeSecretKey);
  }
  if (stripeWebhookSecret) {
    app.decorate("stripeWebhookSecret", stripeWebhookSecret);
  }

  // Routes
  app.register(healthRoutes);
  app.register(mealRoutes);
  app.register(userRoutes);
  app.register(matchingRoutes);
  app.register(orderRoutes);
  app.register(subscriptionRoutes);
  app.register(deliveryRoutes);
  app.register(stripeWebhookRoutes);
  app.register(sseRoutes);

  return app;
}
