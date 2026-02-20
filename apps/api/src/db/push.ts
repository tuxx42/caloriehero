import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";

// Load .env from monorepo root
dotenvConfig({ path: resolve(import.meta.dirname, "../../../../.env") });

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://caloriehero:caloriehero@localhost:5432/caloriehero";
const sql = postgres(databaseUrl);

async function push() {
  console.log("Creating database tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS meals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(20) NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      fiber REAL,
      sugar REAL,
      serving_size VARCHAR(50) NOT NULL,
      price REAL NOT NULL,
      allergens JSONB NOT NULL DEFAULT '[]',
      dietary_tags JSONB NOT NULL DEFAULT '[]',
      image_url TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      poster_product_id VARCHAR(100),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE NOT NULL REFERENCES users(id),
      macro_targets JSONB NOT NULL,
      fitness_goal VARCHAR(20) NOT NULL,
      allergies JSONB NOT NULL DEFAULT '[]',
      dietary_preferences JSONB NOT NULL DEFAULT '[]',
      delivery_address TEXT,
      delivery_lat REAL,
      delivery_lng REAL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      status VARCHAR(20) NOT NULL DEFAULT 'pending_payment',
      type VARCHAR(20) NOT NULL,
      total REAL NOT NULL,
      delivery_slot_id UUID,
      delivery_address TEXT,
      poster_order_id VARCHAR(100),
      stripe_payment_intent_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id),
      meal_id UUID NOT NULL REFERENCES meals(id),
      meal_name VARCHAR(200) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      radius_km REAL NOT NULL,
      delivery_fee REAL NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS delivery_slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date VARCHAR(10) NOT NULL,
      start_time VARCHAR(5) NOT NULL,
      end_time VARCHAR(5) NOT NULL,
      zone_id UUID NOT NULL REFERENCES delivery_zones(id),
      capacity INTEGER NOT NULL,
      booked_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      stripe_subscription_id VARCHAR(255),
      schedule JSONB NOT NULL,
      macro_targets JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      paused_at TIMESTAMP,
      cancelled_at TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      date VARCHAR(10) NOT NULL,
      total_score REAL NOT NULL,
      actual_macros JSONB NOT NULL,
      target_macros JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS meal_plan_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_id UUID NOT NULL REFERENCES meal_plans(id),
      slot VARCHAR(20) NOT NULL,
      meal_id UUID NOT NULL REFERENCES meals(id),
      score REAL NOT NULL,
      slot_targets JSONB NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payment_intents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
      amount REAL NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'thb',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      order_id UUID NOT NULL REFERENCES orders(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  console.log("All tables created!");
  await sql.end();
}

push().catch((err) => {
  console.error("Push failed:", err);
  process.exit(1);
});
