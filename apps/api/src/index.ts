import "dotenv/config";
import { config } from "./config/env.js";
import { buildApp } from "./app.js";

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
