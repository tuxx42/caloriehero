import type {
  Meal,
  MealSlot,
  ScoringWeights,
  SlotAllocation,
} from "@caloriehero/shared-types";
import { calculateScore } from "./scoring.js";
import { DEFAULT_SCORING_WEIGHTS } from "./constants.js";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface PlanItem {
  slot: MealSlot;
  meal: Meal;
  score: number;
}

export interface OptimalPlan {
  items: PlanItem[];
  totalScore: number;
}

// ---------------------------------------------------------------------------
// Branch-and-bound optimizer
// ---------------------------------------------------------------------------

/**
 * Finds the optimal combination of meals across slots that maximises
 * the total weighted score.
 *
 * Algorithm: branch-and-bound in slot order.
 * - At each slot, meals are pre-sorted by their slot-specific score (desc)
 *   so we explore the most promising branches first.
 * - Pruning: if the running score + the theoretical maximum remaining score
 *   (assuming score=1 for all unassigned slots) cannot beat the current best,
 *   the branch is abandoned.
 *
 * Returns null when no meals are available for any required slot.
 */
export function findOptimalPlan(
  slotAllocations: SlotAllocation[],
  mealsBySlot: Map<MealSlot, Meal[]>,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): OptimalPlan | null {
  if (slotAllocations.length === 0) return null;

  // Pre-score and sort meals for each slot
  const rankedBySlot: { slot: MealSlot; meals: { meal: Meal; score: number }[] }[] =
    slotAllocations.map((allocation) => {
      const meals = mealsBySlot.get(allocation.slot) ?? [];
      const scored = meals
        .map((meal) => ({
          meal,
          score: calculateScore(meal.nutritionalInfo, allocation.targets, weights),
        }))
        .sort((a, b) => {
          const diff = b.score - a.score;
          if (diff !== 0) return diff;
          return a.meal.id.localeCompare(b.meal.id);
        });
      return { slot: allocation.slot, meals: scored };
    });

  // Verify every slot has at least one meal
  for (const slotData of rankedBySlot) {
    if (slotData.meals.length === 0) return null;
  }

  const numSlots = rankedBySlot.length;
  let bestScore = -1;
  let bestItems: PlanItem[] | null = null;

  // current path state
  const currentItems: PlanItem[] = [];
  let runningScore = 0;

  function search(slotIndex: number): void {
    if (slotIndex === numSlots) {
      const totalScore = runningScore / numSlots;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestItems = currentItems.map((item) => ({ ...item }));
      }
      return;
    }

    // Upper-bound pruning: current running score sum + max possible for remaining slots
    // Maximum possible total score sum = runningScore + (numSlots - slotIndex) * 1.0
    const remainingSlots = numSlots - slotIndex;
    const upperBound = (runningScore + remainingSlots) / numSlots;
    // Use a tiny epsilon to avoid floating-point precision issues when comparing scores
    if (upperBound <= bestScore + 1e-12) {
      return; // Cannot beat current best — prune this branch
    }

    const slotData = rankedBySlot[slotIndex];
    if (slotData === undefined) return;

    for (const { meal, score } of slotData.meals) {
      // Within-slot pruning: even if this meal contributes `score` and all remaining
      // slots score 1.0, can we beat bestScore?
      const upperBoundWithMeal = (runningScore + score + remainingSlots - 1) / numSlots;
      if (upperBoundWithMeal <= bestScore + 1e-12) {
        // Since meals are sorted desc, subsequent meals have score <= this one,
        // so we can stop exploring this slot entirely.
        break;
      }

      // Individual slot contribution to the running sum
      runningScore += score;
      currentItems.push({ slot: slotData.slot, meal, score });

      search(slotIndex + 1);

      currentItems.pop();
      runningScore -= score;

      // Early exit: found a perfect solution
      if (bestScore >= 1.0) return;
    }
  }

  search(0);

  if (bestItems === null) return null;

  return {
    items: bestItems,
    totalScore: bestScore,
  };
}
