// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export { matchMeals } from "./per-meal-matcher.js";
export { generateDailyPlan } from "./daily-planner.js";

// ---------------------------------------------------------------------------
// Re-exports for testing and advanced usage
// ---------------------------------------------------------------------------

export { calculateScore, calculateDeviation } from "./scoring.js";
export type { MacroDeviation } from "./scoring.js";

export {
  filterByAllergens,
  filterByDietaryTags,
  filterByCategory,
  filterMeals,
} from "./filters.js";
export type { FilterOptions } from "./filters.js";

export { allocateSlots } from "./slot-allocator.js";

export { findOptimalPlan } from "./optimizer.js";
export type { PlanItem, OptimalPlan } from "./optimizer.js";

export {
  DEFAULT_SLOT_PERCENTAGES,
  DEFAULT_TOLERANCE,
  DEFAULT_SCORING_WEIGHTS,
} from "./constants.js";
