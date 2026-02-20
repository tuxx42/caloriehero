import "dotenv/config";
import { resolve } from "node:path";
import { config as dotenvConfig } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { meals } from "./schema/meals.js";
import { deliveryZones, deliverySlots } from "./schema/delivery.js";

// Load .env from monorepo root
dotenvConfig({ path: resolve(import.meta.dirname, "../../../../.env") });

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://caloriehero:caloriehero@localhost:5432/caloriehero";
const client = postgres(databaseUrl);
const db = drizzle(client);

const seedMeals = [
  {
    name: "Grilled Chicken Breast",
    description: "Herb-marinated chicken breast grilled to perfection, served with steamed broccoli and brown rice.",
    category: "lunch",
    calories: 420,
    protein: 48,
    carbs: 32,
    fat: 10,
    fiber: 4,
    sugar: 2,
    servingSize: "350g",
    price: 180,
    allergens: [],
    dietaryTags: ["high_protein", "gluten_free"],
  },
  {
    name: "Salmon Poke Bowl",
    description: "Fresh Atlantic salmon over sushi rice with edamame, avocado, cucumber, and sesame dressing.",
    category: "lunch",
    calories: 520,
    protein: 35,
    carbs: 52,
    fat: 18,
    fiber: 5,
    sugar: 6,
    servingSize: "400g",
    price: 250,
    allergens: ["fish", "soy", "sesame"],
    dietaryTags: ["high_protein", "dairy_free"],
  },
  {
    name: "Greek Yogurt Parfait",
    description: "Creamy Greek yogurt layered with granola, mixed berries, and a drizzle of honey.",
    category: "breakfast",
    calories: 320,
    protein: 22,
    carbs: 42,
    fat: 8,
    fiber: 3,
    sugar: 18,
    servingSize: "280g",
    price: 120,
    allergens: ["dairy"],
    dietaryTags: ["vegetarian"],
  },
  {
    name: "Turkey & Avocado Wrap",
    description: "Sliced turkey, avocado, mixed greens, and chipotle mayo in a whole wheat tortilla.",
    category: "lunch",
    calories: 450,
    protein: 32,
    carbs: 38,
    fat: 18,
    fiber: 6,
    sugar: 3,
    servingSize: "320g",
    price: 160,
    allergens: ["wheat", "eggs"],
    dietaryTags: ["high_protein"],
  },
  {
    name: "Beef Stir-Fry",
    description: "Tender beef strips with bell peppers, snap peas, and broccoli in garlic ginger sauce, served over jasmine rice.",
    category: "dinner",
    calories: 580,
    protein: 42,
    carbs: 55,
    fat: 18,
    fiber: 4,
    sugar: 8,
    servingSize: "420g",
    price: 220,
    allergens: ["soy"],
    dietaryTags: ["high_protein", "dairy_free"],
  },
  {
    name: "Veggie Buddha Bowl",
    description: "Quinoa base with roasted sweet potato, chickpeas, kale, tahini dressing, and pickled onions.",
    category: "lunch",
    calories: 480,
    protein: 18,
    carbs: 62,
    fat: 16,
    fiber: 12,
    sugar: 8,
    servingSize: "380g",
    price: 170,
    allergens: ["sesame"],
    dietaryTags: ["vegan", "gluten_free", "dairy_free"],
  },
  {
    name: "Egg White Omelette",
    description: "Fluffy egg white omelette with spinach, mushrooms, and feta cheese, served with whole grain toast.",
    category: "breakfast",
    calories: 280,
    protein: 28,
    carbs: 22,
    fat: 8,
    fiber: 3,
    sugar: 2,
    servingSize: "250g",
    price: 130,
    allergens: ["eggs", "dairy", "wheat"],
    dietaryTags: ["vegetarian", "high_protein"],
  },
  {
    name: "Teriyaki Salmon",
    description: "Glazed Atlantic salmon fillet with steamed jasmine rice and stir-fried vegetables.",
    category: "dinner",
    calories: 550,
    protein: 40,
    carbs: 48,
    fat: 20,
    fiber: 3,
    sugar: 10,
    servingSize: "380g",
    price: 280,
    allergens: ["fish", "soy"],
    dietaryTags: ["high_protein", "dairy_free"],
  },
  {
    name: "Overnight Oats",
    description: "Rolled oats soaked in almond milk with chia seeds, banana, peanut butter, and dark chocolate chips.",
    category: "breakfast",
    calories: 380,
    protein: 14,
    carbs: 52,
    fat: 14,
    fiber: 8,
    sugar: 16,
    servingSize: "300g",
    price: 110,
    allergens: ["peanuts"],
    dietaryTags: ["vegan", "dairy_free"],
  },
  {
    name: "Chicken Caesar Salad",
    description: "Grilled chicken breast over romaine lettuce with parmesan, croutons, and classic Caesar dressing.",
    category: "lunch",
    calories: 380,
    protein: 38,
    carbs: 18,
    fat: 16,
    fiber: 3,
    sugar: 2,
    servingSize: "320g",
    price: 170,
    allergens: ["dairy", "eggs", "wheat", "fish"],
    dietaryTags: ["high_protein"],
  },
  {
    name: "Shrimp Pad Thai",
    description: "Rice noodles with shrimp, bean sprouts, scrambled egg, peanuts, and tamarind sauce.",
    category: "dinner",
    calories: 520,
    protein: 28,
    carbs: 62,
    fat: 16,
    fiber: 3,
    sugar: 12,
    servingSize: "380g",
    price: 200,
    allergens: ["shellfish", "peanuts", "eggs", "soy"],
    dietaryTags: ["dairy_free"],
  },
  {
    name: "Protein Smoothie Bowl",
    description: "Blended acai, banana, and protein powder topped with granola, coconut, and fresh berries.",
    category: "breakfast",
    calories: 350,
    protein: 26,
    carbs: 48,
    fat: 8,
    fiber: 6,
    sugar: 22,
    servingSize: "320g",
    price: 150,
    allergens: ["tree_nuts"],
    dietaryTags: ["vegetarian", "high_protein", "dairy_free"],
  },
  {
    name: "Lamb Kofta Plate",
    description: "Spiced lamb kofta with hummus, tabbouleh, warm pita bread, and tzatziki sauce.",
    category: "dinner",
    calories: 620,
    protein: 38,
    carbs: 45,
    fat: 28,
    fiber: 5,
    sugar: 4,
    servingSize: "420g",
    price: 260,
    allergens: ["dairy", "wheat", "sesame"],
    dietaryTags: ["high_protein"],
  },
  {
    name: "Tofu Stir-Fry",
    description: "Crispy tofu with mixed vegetables in sweet chili sauce, served over brown rice.",
    category: "dinner",
    calories: 420,
    protein: 22,
    carbs: 52,
    fat: 14,
    fiber: 6,
    sugar: 10,
    servingSize: "380g",
    price: 160,
    allergens: ["soy"],
    dietaryTags: ["vegan", "dairy_free"],
  },
  {
    name: "Avocado Toast with Eggs",
    description: "Sourdough toast with smashed avocado, poached eggs, cherry tomatoes, and everything seasoning.",
    category: "breakfast",
    calories: 380,
    protein: 18,
    carbs: 32,
    fat: 22,
    fiber: 7,
    sugar: 3,
    servingSize: "280g",
    price: 140,
    allergens: ["eggs", "wheat"],
    dietaryTags: ["vegetarian"],
  },
  {
    name: "Chicken Tikka Masala",
    description: "Tender chicken in creamy tomato tikka sauce with basmati rice and garlic naan.",
    category: "dinner",
    calories: 650,
    protein: 42,
    carbs: 60,
    fat: 24,
    fiber: 4,
    sugar: 8,
    servingSize: "450g",
    price: 230,
    allergens: ["dairy", "wheat"],
    dietaryTags: ["high_protein"],
  },
  {
    name: "Mixed Nuts & Fruit",
    description: "Premium mix of almonds, cashews, dried cranberries, and dark chocolate pieces.",
    category: "snack",
    calories: 220,
    protein: 6,
    carbs: 20,
    fat: 14,
    fiber: 3,
    sugar: 12,
    servingSize: "60g",
    price: 80,
    allergens: ["tree_nuts"],
    dietaryTags: ["vegan", "gluten_free", "dairy_free"],
  },
  {
    name: "Protein Bar",
    description: "Whey protein bar with peanut butter, oats, and dark chocolate coating.",
    category: "snack",
    calories: 250,
    protein: 20,
    carbs: 28,
    fat: 8,
    fiber: 3,
    sugar: 10,
    servingSize: "65g",
    price: 70,
    allergens: ["dairy", "peanuts", "wheat"],
    dietaryTags: ["high_protein"],
  },
  {
    name: "Grilled Fish Tacos",
    description: "Blackened white fish in corn tortillas with mango salsa, cabbage slaw, and lime crema.",
    category: "lunch",
    calories: 440,
    protein: 32,
    carbs: 42,
    fat: 16,
    fiber: 5,
    sugar: 8,
    servingSize: "340g",
    price: 190,
    allergens: ["fish", "dairy"],
    dietaryTags: ["high_protein"],
  },
  {
    name: "Keto Chicken Thighs",
    description: "Crispy skin chicken thighs with cauliflower mash, roasted asparagus, and herb butter.",
    category: "dinner",
    calories: 520,
    protein: 42,
    carbs: 8,
    fat: 36,
    fiber: 4,
    sugar: 3,
    servingSize: "380g",
    price: 210,
    allergens: ["dairy"],
    dietaryTags: ["keto", "low_carb", "high_protein", "gluten_free"],
  },
];

const seedZones = [
  { name: "City Center", lat: 13.7563, lng: 100.5018, radiusKm: 5, deliveryFee: 0 },
  { name: "Sukhumvit", lat: 13.7310, lng: 100.5673, radiusKm: 8, deliveryFee: 30 },
  { name: "Silom", lat: 13.7262, lng: 100.5234, radiusKm: 6, deliveryFee: 20 },
];

async function seed() {
  console.log("Seeding database...");

  // Seed meals
  console.log(`Inserting ${seedMeals.length} meals...`);
  await db.insert(meals).values(seedMeals);
  console.log("Meals inserted.");

  // Seed delivery zones
  console.log(`Inserting ${seedZones.length} delivery zones...`);
  const insertedZones = await db.insert(deliveryZones).values(seedZones).returning();
  console.log("Delivery zones inserted.");

  // Seed delivery slots for each zone (next 7 days)
  const slots = [];
  const today = new Date();
  for (const zone of insertedZones) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().slice(0, 10);
      slots.push(
        { date: dateStr, startTime: "09:00", endTime: "12:00", zoneId: zone.id, capacity: 20, bookedCount: 0 },
        { date: dateStr, startTime: "12:00", endTime: "15:00", zoneId: zone.id, capacity: 30, bookedCount: 0 },
        { date: dateStr, startTime: "17:00", endTime: "20:00", zoneId: zone.id, capacity: 25, bookedCount: 0 },
      );
    }
  }
  console.log(`Inserting ${slots.length} delivery slots...`);
  await db.insert(deliverySlots).values(slots);
  console.log("Delivery slots inserted.");

  console.log("Seed complete!");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
