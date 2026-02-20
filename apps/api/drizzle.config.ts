import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/db/schema/meals.ts",
    "./src/db/schema/users.ts",
    "./src/db/schema/orders.ts",
    "./src/db/schema/subscriptions.ts",
    "./src/db/schema/delivery.ts",
    "./src/db/schema/meal-plans.ts",
    "./src/db/schema/payments.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://caloriehero:caloriehero@localhost:5432/caloriehero",
  },
});
