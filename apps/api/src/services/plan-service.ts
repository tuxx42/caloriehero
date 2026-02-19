import { matchMeals, generateDailyPlan } from "@caloriehero/meal-plan-engine";
import type { Database } from "../db/index.js";
import { listMeals } from "./meal-service.js";
import { getProfile } from "./profile-service.js";
import type { Meal } from "@caloriehero/shared-types";

function toEngineMeal(meal: ReturnType<typeof rowToMeal>): Meal {
  return {
    id: meal.id,
    name: meal.name,
    description: meal.description,
    category: meal.category as Meal["category"],
    nutritionalInfo: meal.nutritionalInfo,
    servingSize: meal.servingSize,
    price: meal.price,
    allergens: meal.allergens as Meal["allergens"],
    dietaryTags: meal.dietaryTags as Meal["dietaryTags"],
    imageUrl: meal.imageUrl,
    active: meal.active,
    posterProductId: meal.posterProductId,
    createdAt: meal.createdAt,
    updatedAt: meal.updatedAt,
  };
}

// Inline the meal shape from meal-service so we don't re-export internals
type ServiceMeal = Awaited<ReturnType<typeof listMeals>>[number];

function rowToMeal(meal: ServiceMeal): ServiceMeal {
  return meal;
}

export interface MatchMealsOptions {
  category?: string;
  limit?: number;
}

export async function matchMealsForUser(
  db: Database,
  userId: string,
  opts: MatchMealsOptions
) {
  // 1. Get user profile (macro targets, allergies, dietary prefs)
  const profile = await getProfile(db, userId);

  if (!profile) {
    throw Object.assign(new Error("User profile not found"), {
      statusCode: 404,
      code: "PROFILE_NOT_FOUND",
    });
  }

  // 2. Load active meals from DB
  const mealList = await listMeals(db, { active: true });
  const engineMeals = mealList.map((m) => toEngineMeal(m));

  // 3. Call matchMeals() from engine
  const results = matchMeals(engineMeals, {
    constraints: {
      targets: profile.macroTargets,
    },
    allergies: profile.allergies as Meal["allergens"],
    dietaryPreferences: profile.dietaryPreferences as Meal["dietaryTags"],
    category: opts.category as Meal["category"] | undefined,
    limit: opts.limit ?? 10,
  });

  return results;
}

export interface GeneratePlanOptions {
  date: string;
  slots?: Array<{ slot: string; percentage: number }>;
}

export async function generatePlanForUser(
  db: Database,
  userId: string,
  opts: GeneratePlanOptions
) {
  // 1. Get user profile
  const profile = await getProfile(db, userId);

  if (!profile) {
    throw Object.assign(new Error("User profile not found"), {
      statusCode: 404,
      code: "PROFILE_NOT_FOUND",
    });
  }

  // 2. Load active meals
  const mealList = await listMeals(db, { active: true });
  const engineMeals = mealList.map((m) => toEngineMeal(m));

  // 3. Default slots if not provided
  const defaultSlots = [
    { slot: "breakfast" as const, percentage: 0.25 },
    { slot: "lunch" as const, percentage: 0.35 },
    { slot: "dinner" as const, percentage: 0.35 },
    { slot: "snack" as const, percentage: 0.05 },
  ];

  const requestSlots =
    opts.slots && opts.slots.length > 0
      ? (opts.slots as Array<{
          slot: "breakfast" | "lunch" | "dinner" | "snack";
          percentage: number;
        }>)
      : defaultSlots;

  // 4. Call generateDailyPlan() from engine
  const result = generateDailyPlan(engineMeals, {
    dailyTargets: profile.macroTargets,
    slots: requestSlots,
    allergies: profile.allergies as Meal["allergens"],
    dietaryPreferences: profile.dietaryPreferences as Meal["dietaryTags"],
  });

  return result;
}
