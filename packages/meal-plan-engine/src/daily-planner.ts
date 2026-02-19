import type {
  Meal,
  MealSlot,
  MealCategory,
  PlanRequest,
  PlanResult,
  NutritionalInfo,
} from "@caloriehero/shared-types";
import { filterMeals } from "./filters.js";
import { allocateSlots } from "./slot-allocator.js";
import { findOptimalPlan } from "./optimizer.js";
import { DEFAULT_SCORING_WEIGHTS } from "./constants.js";

// ---------------------------------------------------------------------------
// Meal category → slot mapping
// ---------------------------------------------------------------------------

/**
 * Maps a MealCategory to its corresponding MealSlot.
 * Since MealCategory and MealSlot share the same values, this is a direct
 * identity mapping.
 */
function categoryToSlot(category: MealCategory): MealSlot {
  // MealCategory and MealSlot have identical enum values
  return category as MealSlot;
}

// ---------------------------------------------------------------------------
// Actual macro summation
// ---------------------------------------------------------------------------

function sumNutritionalInfo(infos: NutritionalInfo[]): NutritionalInfo {
  return infos.reduce(
    (acc, info) => ({
      calories: acc.calories + info.calories,
      protein: acc.protein + info.protein,
      carbs: acc.carbs + info.carbs,
      fat: acc.fat + info.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// ---------------------------------------------------------------------------
// Daily plan generator
// ---------------------------------------------------------------------------

/**
 * Generates an optimised daily meal plan:
 * 1. Filter all meals by dietary restrictions / allergens
 * 2. Allocate daily targets across requested slots
 * 3. Group filtered meals by the slot they can fill
 * 4. Run the branch-and-bound optimizer
 * 5. Build and return the PlanResult
 *
 * Returns null when no valid plan can be constructed (e.g. no meals survive
 * the filters for a required slot).
 */
export function generateDailyPlan(
  meals: Meal[],
  request: PlanRequest
): PlanResult | null {
  const {
    dailyTargets,
    slots,
    allergies,
    dietaryPreferences,
    weights,
  } = request;

  const effectiveWeights = weights ?? DEFAULT_SCORING_WEIGHTS;

  // Step 1: Filter meals globally
  const filtered = filterMeals(meals, { allergies, dietaryPreferences });

  // Step 2: Allocate slot targets
  const slotAllocations = allocateSlots(dailyTargets, slots);

  // Step 3: Group meals by slot
  const mealsBySlot = new Map<MealSlot, Meal[]>();

  for (const { slot } of slotAllocations) {
    // A meal can fill a slot if its category matches the slot name
    const slotMeals = filtered.filter(
      (meal) => categoryToSlot(meal.category) === slot
    );
    mealsBySlot.set(slot, slotMeals);
  }

  // Step 4: Optimize
  const optimal = findOptimalPlan(slotAllocations, mealsBySlot, effectiveWeights);

  if (optimal === null) return null;

  // Step 5: Build PlanResult
  const items: PlanResult["items"] = optimal.items.map((item) => {
    const allocation = slotAllocations.find((a) => a.slot === item.slot);
    return {
      slot: item.slot,
      meal: item.meal,
      score: item.score,
      slotTargets: allocation!.targets,
    };
  });

  const actualMacros = sumNutritionalInfo(
    optimal.items.map((item) => item.meal.nutritionalInfo)
  );

  return {
    items,
    totalScore: optimal.totalScore,
    actualMacros,
    targetMacros: dailyTargets,
  };
}
