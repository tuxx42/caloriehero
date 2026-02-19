import type { Meal, MealMatchRequest, ScoredMeal } from "@caloriehero/shared-types";
import { filterMeals } from "./filters.js";
import { calculateScore, calculateDeviation } from "./scoring.js";
import { DEFAULT_SCORING_WEIGHTS } from "./constants.js";

/**
 * Full per-meal matching pipeline:
 * 1. Filter meals by allergens, dietary preferences, and category
 * 2. Score each meal against the macro targets
 * 3. Sort by score descending
 * 4. Apply limit
 *
 * Returns a ranked list of ScoredMeal objects.
 */
export function matchMeals(meals: Meal[], request: MealMatchRequest): ScoredMeal[] {
  const { constraints, allergies, dietaryPreferences, category, limit } = request;
  const { targets, weights } = constraints;

  // Step 1: Filter
  const filtered = filterMeals(meals, {
    allergies,
    dietaryPreferences,
    category,
  });

  // Step 2: Score
  const effectiveWeights = weights ?? DEFAULT_SCORING_WEIGHTS;

  const scored: ScoredMeal[] = filtered.map((meal) => ({
    meal,
    score: calculateScore(meal.nutritionalInfo, targets, effectiveWeights),
    deviation: calculateDeviation(meal.nutritionalInfo, targets),
  }));

  // Step 3: Sort by score descending (deterministic: stable sort with id tiebreak)
  scored.sort((a, b) => {
    const diff = b.score - a.score;
    if (diff !== 0) return diff;
    // Tiebreak by meal id for determinism
    return a.meal.id.localeCompare(b.meal.id);
  });

  // Step 4: Apply limit
  return scored.slice(0, limit);
}
