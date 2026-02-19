import type { ScoringWeights, Tolerance } from "@caloriehero/shared-types";
import type { MealSlot } from "@caloriehero/shared-types";

// ---------------------------------------------------------------------------
// Default slot percentages
// ---------------------------------------------------------------------------

export const DEFAULT_SLOT_PERCENTAGES: { slot: MealSlot; percentage: number }[] = [
  { slot: "breakfast", percentage: 0.25 },
  { slot: "lunch", percentage: 0.35 },
  { slot: "dinner", percentage: 0.30 },
  { slot: "snack", percentage: 0.10 },
];

// ---------------------------------------------------------------------------
// Default tolerance — matches shared-types schema defaults
// ---------------------------------------------------------------------------

export const DEFAULT_TOLERANCE: Tolerance = {
  calories: 0.1,
  protein: 0.15,
  carbs: 0.15,
  fat: 0.15,
};

// ---------------------------------------------------------------------------
// Default scoring weights — matches shared-types schema defaults
// ---------------------------------------------------------------------------

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  calories: 0.4,
  protein: 0.3,
  carbs: 0.15,
  fat: 0.15,
};
