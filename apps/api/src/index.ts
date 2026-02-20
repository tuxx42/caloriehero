import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";
import { parseEnv } from "./config/env.js";
import { buildApp } from "./app.js";

// Load .env from monorepo root
dotenvConfig({ path: resolve(import.meta.dirname, "../../../.env") });

const config = parseEnv();

const app = buildApp({
  useMockAuth: false,
  jwtSecret: config.JWT_SECRET,
  databaseUrl: config.DATABASE_URL,
  redisUrl: config.REDIS_URL,
  stripeSecretKey: config.STRIPE_SECRET_KEY,
  stripeWebhookSecret: config.STRIPE_WEBHOOK_SECRET,
  logger: config.NODE_ENV !== "test",
  enableRateLimit: config.NODE_ENV === "production",
});

app.listen({ port: config.API_PORT, host: config.API_HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
