import type { NutritionalInfo, MacroTargets, ScoringWeights } from "@caloriehero/shared-types";
import { DEFAULT_SCORING_WEIGHTS } from "./constants.js";

// ---------------------------------------------------------------------------
// Deviation
// ---------------------------------------------------------------------------

export interface MacroDeviation {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Calculates absolute per-macro deviation between actual nutritional info
 * and target macros.
 */
export function calculateDeviation(
  actual: NutritionalInfo,
  target: MacroTargets
): MacroDeviation {
  return {
    calories: Math.abs(actual.calories - target.calories),
    protein: Math.abs(actual.protein - target.protein),
    carbs: Math.abs(actual.carbs - target.carbs),
    fat: Math.abs(actual.fat - target.fat),
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Scores a single macro dimension.
 *
 * - If target === 0 and actual === 0 → 1.0 (perfect)
 * - If target === 0 and actual > 0   → 0.0 (penalised)
 * - Otherwise: 1 - min(|actual - target| / target, 1) clamped to [0, 1]
 */
function scoreMacro(actual: number, target: number): number {
  if (target === 0) {
    return actual === 0 ? 1.0 : 0.0;
  }
  const normalizedDeviation = Math.abs(actual - target) / target;
  return Math.max(0, 1 - Math.min(normalizedDeviation, 1));
}

/**
 * Calculates a weighted 0–1 score for how well `actual` matches `target`.
 * 1.0 = perfect macro match, 0 = worst possible.
 *
 * Uses a weighted average of per-macro scores. The weights do not need to
 * sum to 1 — they are normalised internally.
 */
export function calculateScore(
  actual: NutritionalInfo,
  target: MacroTargets,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): number {
  const macroScores = {
    calories: scoreMacro(actual.calories, target.calories),
    protein: scoreMacro(actual.protein, target.protein),
    carbs: scoreMacro(actual.carbs, target.carbs),
    fat: scoreMacro(actual.fat, target.fat),
  };

  const totalWeight =
    weights.calories + weights.protein + weights.carbs + weights.fat;

  if (totalWeight === 0) {
    // Unweighted average fallback
    return (
      (macroScores.calories +
        macroScores.protein +
        macroScores.carbs +
        macroScores.fat) /
      4
    );
  }

  const weightedSum =
    macroScores.calories * weights.calories +
    macroScores.protein * weights.protein +
    macroScores.carbs * weights.carbs +
    macroScores.fat * weights.fat;

  return weightedSum / totalWeight;
}
