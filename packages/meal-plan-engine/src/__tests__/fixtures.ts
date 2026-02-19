import type { Meal, MacroTargets } from "@caloriehero/shared-types";

// ---------------------------------------------------------------------------
// Helper to create a minimal valid Meal
// ---------------------------------------------------------------------------

function makeMeal(partial: Partial<Meal> & Pick<Meal, "id" | "name" | "category" | "nutritionalInfo">): Meal {
  return {
    description: `${partial.name} - healthy Thai meal`,
    servingSize: "350g",
    price: 120,
    allergens: [],
    dietaryTags: [],
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Breakfast meals (8 meals)
// ---------------------------------------------------------------------------

export const breakfastMeals: Meal[] = [
  makeMeal({
    id: "b1000000-0000-0000-0000-000000000001",
    name: "Khao Tom Moo (Rice Soup with Pork)",
    category: "breakfast",
    nutritionalInfo: { calories: 320, protein: 18, carbs: 45, fat: 8 },
    allergens: ["soy"],
    dietaryTags: ["halal"],
  }),
  makeMeal({
    id: "b2000000-0000-0000-0000-000000000002",
    name: "Thai Omelette with Brown Rice",
    category: "breakfast",
    nutritionalInfo: { calories: 380, protein: 22, carbs: 40, fat: 14 },
    allergens: ["eggs"],
    dietaryTags: ["gluten_free", "halal"],
  }),
  makeMeal({
    id: "b3000000-0000-0000-0000-000000000003",
    name: "Protein Smoothie Bowl",
    category: "breakfast",
    nutritionalInfo: { calories: 420, protein: 35, carbs: 38, fat: 10 },
    allergens: ["dairy"],
    dietaryTags: ["vegetarian", "high_protein", "gluten_free"],
  }),
  makeMeal({
    id: "b4000000-0000-0000-0000-000000000004",
    name: "Avocado Toast with Eggs",
    category: "breakfast",
    nutritionalInfo: { calories: 450, protein: 20, carbs: 35, fat: 22 },
    allergens: ["eggs", "wheat"],
    dietaryTags: ["vegetarian"],
  }),
  makeMeal({
    id: "b5000000-0000-0000-0000-000000000005",
    name: "Mango Sticky Rice (Low Sugar)",
    category: "breakfast",
    nutritionalInfo: { calories: 350, protein: 8, carbs: 68, fat: 6 },
    allergens: [],
    dietaryTags: ["vegetarian", "vegan", "gluten_free"],
  }),
  makeMeal({
    id: "b6000000-0000-0000-0000-000000000006",
    name: "Keto Egg Salad",
    category: "breakfast",
    nutritionalInfo: { calories: 290, protein: 18, carbs: 4, fat: 22 },
    allergens: ["eggs"],
    dietaryTags: ["keto", "low_carb", "gluten_free"],
  }),
  makeMeal({
    id: "b7000000-0000-0000-0000-000000000007",
    name: "Greek Yogurt with Granola",
    category: "breakfast",
    nutritionalInfo: { calories: 310, protein: 16, carbs: 42, fat: 7 },
    allergens: ["dairy", "wheat"],
    dietaryTags: ["vegetarian", "high_protein"],
  }),
  makeMeal({
    id: "b8000000-0000-0000-0000-000000000008",
    name: "Tofu Scramble with Vegetables",
    category: "breakfast",
    nutritionalInfo: { calories: 280, protein: 20, carbs: 18, fat: 12 },
    allergens: ["soy"],
    dietaryTags: ["vegetarian", "vegan", "gluten_free", "dairy_free"],
  }),
];

// ---------------------------------------------------------------------------
// Lunch meals (10 meals)
// ---------------------------------------------------------------------------

export const lunchMeals: Meal[] = [
  makeMeal({
    id: "l1000000-0000-0000-0000-000000000001",
    name: "Pad Thai Gai (Chicken Pad Thai)",
    category: "lunch",
    nutritionalInfo: { calories: 520, protein: 32, carbs: 58, fat: 16 },
    allergens: ["peanuts", "soy", "fish", "eggs"],
    dietaryTags: ["halal"],
  }),
  makeMeal({
    id: "l2000000-0000-0000-0000-000000000002",
    name: "Grilled Chicken Salad",
    category: "lunch",
    nutritionalInfo: { calories: 380, protein: 40, carbs: 18, fat: 14 },
    allergens: [],
    dietaryTags: ["gluten_free", "halal", "high_protein", "dairy_free"],
  }),
  makeMeal({
    id: "l3000000-0000-0000-0000-000000000003",
    name: "Tom Yum Soup with Tofu",
    category: "lunch",
    nutritionalInfo: { calories: 250, protein: 18, carbs: 20, fat: 8 },
    allergens: ["soy"],
    dietaryTags: ["vegetarian", "vegan", "gluten_free", "dairy_free"],
  }),
  makeMeal({
    id: "l4000000-0000-0000-0000-000000000004",
    name: "Som Tum with Grilled Pork",
    category: "lunch",
    nutritionalInfo: { calories: 420, protein: 35, carbs: 25, fat: 18 },
    allergens: ["peanuts", "fish"],
    dietaryTags: ["gluten_free", "halal"],
  }),
  makeMeal({
    id: "l5000000-0000-0000-0000-000000000005",
    name: "Brown Rice Beef Bowl",
    category: "lunch",
    nutritionalInfo: { calories: 580, protein: 38, carbs: 65, fat: 15 },
    allergens: ["soy"],
    dietaryTags: ["high_protein", "halal"],
  }),
  makeMeal({
    id: "l6000000-0000-0000-0000-000000000006",
    name: "Keto Larb Moo (Pork Salad)",
    category: "lunch",
    nutritionalInfo: { calories: 330, protein: 28, carbs: 6, fat: 22 },
    allergens: ["fish"],
    dietaryTags: ["keto", "low_carb", "gluten_free"],
  }),
  makeMeal({
    id: "l7000000-0000-0000-0000-000000000007",
    name: "Vegetarian Green Curry with Rice",
    category: "lunch",
    nutritionalInfo: { calories: 490, protein: 14, carbs: 72, fat: 16 },
    allergens: ["dairy"],
    dietaryTags: ["vegetarian", "gluten_free"],
  }),
  makeMeal({
    id: "l8000000-0000-0000-0000-000000000008",
    name: "Salmon with Quinoa",
    category: "lunch",
    nutritionalInfo: { calories: 520, protein: 42, carbs: 38, fat: 18 },
    allergens: ["fish"],
    dietaryTags: ["gluten_free", "high_protein", "dairy_free"],
  }),
  makeMeal({
    id: "l9000000-0000-0000-0000-000000000009",
    name: "Tofu Basil Stir Fry with Rice",
    category: "lunch",
    nutritionalInfo: { calories: 430, protein: 20, carbs: 56, fat: 12 },
    allergens: ["soy"],
    dietaryTags: ["vegetarian", "vegan", "dairy_free"],
  }),
  makeMeal({
    id: "la000000-0000-0000-0000-000000000010",
    name: "High Protein Tuna Bowl",
    category: "lunch",
    nutritionalInfo: { calories: 440, protein: 50, carbs: 32, fat: 10 },
    allergens: ["fish"],
    dietaryTags: ["high_protein", "gluten_free", "dairy_free"],
  }),
];

// ---------------------------------------------------------------------------
// Dinner meals (8 meals)
// ---------------------------------------------------------------------------

export const dinnerMeals: Meal[] = [
  makeMeal({
    id: "d1000000-0000-0000-0000-000000000001",
    name: "Massaman Curry with Chicken",
    category: "dinner",
    nutritionalInfo: { calories: 620, protein: 38, carbs: 52, fat: 26 },
    allergens: ["peanuts", "dairy"],
    dietaryTags: ["halal", "gluten_free"],
  }),
  makeMeal({
    id: "d2000000-0000-0000-0000-000000000002",
    name: "Grilled Sea Bass with Steamed Vegetables",
    category: "dinner",
    nutritionalInfo: { calories: 420, protein: 45, carbs: 18, fat: 16 },
    allergens: ["fish"],
    dietaryTags: ["gluten_free", "high_protein", "dairy_free"],
  }),
  makeMeal({
    id: "d3000000-0000-0000-0000-000000000003",
    name: "Keto Roast Duck with Vegetables",
    category: "dinner",
    nutritionalInfo: { calories: 480, protein: 40, carbs: 8, fat: 32 },
    allergens: [],
    dietaryTags: ["keto", "low_carb", "gluten_free", "dairy_free"],
  }),
  makeMeal({
    id: "d4000000-0000-0000-0000-000000000004",
    name: "Vegan Thai Red Curry",
    category: "dinner",
    nutritionalInfo: { calories: 380, protein: 12, carbs: 58, fat: 14 },
    allergens: ["soy"],
    dietaryTags: ["vegetarian", "vegan", "gluten_free"],
  }),
  makeMeal({
    id: "d5000000-0000-0000-0000-000000000005",
    name: "Beef Bulgogi Bowl",
    category: "dinner",
    nutritionalInfo: { calories: 560, protein: 42, carbs: 48, fat: 20 },
    allergens: ["soy", "sesame"],
    dietaryTags: ["high_protein", "dairy_free"],
  }),
  makeMeal({
    id: "d6000000-0000-0000-0000-000000000006",
    name: "Chicken Tikka Masala with Brown Rice",
    category: "dinner",
    nutritionalInfo: { calories: 590, protein: 44, carbs: 55, fat: 18 },
    allergens: ["dairy"],
    dietaryTags: ["halal", "high_protein", "gluten_free"],
  }),
  makeMeal({
    id: "d7000000-0000-0000-0000-000000000007",
    name: "Tempeh Stir Fry with Noodles",
    category: "dinner",
    nutritionalInfo: { calories: 440, protein: 24, carbs: 54, fat: 14 },
    allergens: ["soy", "wheat"],
    dietaryTags: ["vegetarian", "vegan", "dairy_free"],
  }),
  makeMeal({
    id: "d8000000-0000-0000-0000-000000000008",
    name: "Lean Pork Tenderloin with Sweet Potato",
    category: "dinner",
    nutritionalInfo: { calories: 500, protein: 40, carbs: 45, fat: 14 },
    allergens: [],
    dietaryTags: ["gluten_free", "dairy_free", "high_protein", "halal"],
  }),
];

// ---------------------------------------------------------------------------
// Snack meals (6 meals)
// ---------------------------------------------------------------------------

export const snackMeals: Meal[] = [
  makeMeal({
    id: "s1000000-0000-0000-0000-000000000001",
    name: "Protein Bar (Whey)",
    category: "snack",
    nutritionalInfo: { calories: 220, protein: 20, carbs: 22, fat: 6 },
    allergens: ["dairy", "soy"],
    dietaryTags: ["high_protein", "gluten_free"],
  }),
  makeMeal({
    id: "s2000000-0000-0000-0000-000000000002",
    name: "Mixed Nuts and Dried Fruit",
    category: "snack",
    nutritionalInfo: { calories: 260, protein: 8, carbs: 24, fat: 16 },
    allergens: ["tree_nuts"],
    dietaryTags: ["vegetarian", "vegan", "gluten_free", "dairy_free"],
  }),
  makeMeal({
    id: "s3000000-0000-0000-0000-000000000003",
    name: "Keto Fat Bomb (Peanut Butter)",
    category: "snack",
    nutritionalInfo: { calories: 200, protein: 6, carbs: 4, fat: 18 },
    allergens: ["peanuts"],
    dietaryTags: ["keto", "low_carb", "vegetarian", "gluten_free", "dairy_free"],
  }),
  makeMeal({
    id: "s4000000-0000-0000-0000-000000000004",
    name: "Greek Yogurt with Berries",
    category: "snack",
    nutritionalInfo: { calories: 180, protein: 14, carbs: 20, fat: 4 },
    allergens: ["dairy"],
    dietaryTags: ["vegetarian", "gluten_free", "high_protein"],
  }),
  makeMeal({
    id: "s5000000-0000-0000-0000-000000000005",
    name: "Edamame",
    category: "snack",
    nutritionalInfo: { calories: 150, protein: 12, carbs: 14, fat: 5 },
    allergens: ["soy"],
    dietaryTags: ["vegetarian", "vegan", "gluten_free", "dairy_free"],
  }),
  makeMeal({
    id: "s6000000-0000-0000-0000-000000000006",
    name: "Rice Crackers with Hummus",
    category: "snack",
    nutritionalInfo: { calories: 240, protein: 7, carbs: 36, fat: 8 },
    allergens: ["sesame"],
    dietaryTags: ["vegetarian", "vegan", "dairy_free"],
  }),
];

// ---------------------------------------------------------------------------
// Combined catalog
// ---------------------------------------------------------------------------

export const allMeals: Meal[] = [
  ...breakfastMeals,
  ...lunchMeals,
  ...dinnerMeals,
  ...snackMeals,
];

// ---------------------------------------------------------------------------
// User macro profiles
// ---------------------------------------------------------------------------

/** Standard maintenance profile — ~2000 kcal, balanced macros */
export const maintenanceTargets: MacroTargets = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

/** Bulking profile — ~2800 kcal, high carbs and protein */
export const bulkingTargets: MacroTargets = {
  calories: 2800,
  protein: 200,
  carbs: 320,
  fat: 85,
};

/** Cutting profile — ~1500 kcal, high protein, lower carbs */
export const cuttingTargets: MacroTargets = {
  calories: 1500,
  protein: 160,
  carbs: 120,
  fat: 45,
};

/** Keto profile — ~1800 kcal, very low carbs, high fat */
export const ketoTargets: MacroTargets = {
  calories: 1800,
  protein: 130,
  carbs: 30,
  fat: 140,
};

// ---------------------------------------------------------------------------
// Large catalog fixture for performance tests
// ---------------------------------------------------------------------------

/** Generates a large catalog by repeating meals with unique IDs */
export function generateLargeCatalog(count: number): Meal[] {
  const base = allMeals;
  const result: Meal[] = [];

  for (let i = 0; i < count; i++) {
    const template = base[i % base.length]!;
    result.push({
      ...template,
      id: `${template.id.slice(0, 28)}${String(i).padStart(8, "0")}`,
      name: `${template.name} #${i}`,
      // Vary nutritional info slightly
      nutritionalInfo: {
        calories: Math.max(100, template.nutritionalInfo.calories + (i % 50) - 25),
        protein: Math.max(1, template.nutritionalInfo.protein + (i % 10) - 5),
        carbs: Math.max(0, template.nutritionalInfo.carbs + (i % 10) - 5),
        fat: Math.max(1, template.nutritionalInfo.fat + (i % 6) - 3),
      },
    });
  }

  return result;
}
