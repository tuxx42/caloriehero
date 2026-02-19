import type { MacroTargets, MealSlot, SlotAllocation } from "@caloriehero/shared-types";

const PERCENTAGE_SUM_TOLERANCE = 0.01;

/**
 * Distributes daily macro targets across meal slots proportionally.
 *
 * Validates that percentages sum to approximately 1.0 (within 0.01 tolerance).
 * Applies rounding correction to ensure the allocated macros precisely sum
 * to the daily targets.
 *
 * @throws Error if percentages do not sum to ~1.0
 */
export function allocateSlots(
  dailyTargets: MacroTargets,
  slots: { slot: MealSlot; percentage: number }[]
): SlotAllocation[] {
  if (slots.length === 0) {
    throw new Error("At least one slot must be provided");
  }

  const totalPercentage = slots.reduce((sum, s) => sum + s.percentage, 0);
  if (Math.abs(totalPercentage - 1.0) > PERCENTAGE_SUM_TOLERANCE) {
    throw new Error(
      `Slot percentages must sum to 1.0 (got ${totalPercentage.toFixed(4)})`
    );
  }

  // Calculate raw allocations (may have floating point imprecision)
  const rawAllocations = slots.map((s) => ({
    slot: s.slot,
    percentage: s.percentage,
    targets: {
      calories: dailyTargets.calories * s.percentage,
      protein: dailyTargets.protein * s.percentage,
      carbs: dailyTargets.carbs * s.percentage,
      fat: dailyTargets.fat * s.percentage,
    },
  }));

  // Apply rounding correction: round each allocation and fix the last slot
  // so that sum exactly equals daily targets.
  const rounded = rawAllocations.map((a) => ({
    slot: a.slot,
    percentage: a.percentage,
    targets: {
      calories: Math.round(a.targets.calories * 100) / 100,
      protein: Math.round(a.targets.protein * 100) / 100,
      carbs: Math.round(a.targets.carbs * 100) / 100,
      fat: Math.round(a.targets.fat * 100) / 100,
    },
  }));

  // Fix rounding errors by adjusting the last slot
  if (rounded.length > 0) {
    const sumCalories = rounded.slice(0, -1).reduce((s, a) => s + a.targets.calories, 0);
    const sumProtein = rounded.slice(0, -1).reduce((s, a) => s + a.targets.protein, 0);
    const sumCarbs = rounded.slice(0, -1).reduce((s, a) => s + a.targets.carbs, 0);
    const sumFat = rounded.slice(0, -1).reduce((s, a) => s + a.targets.fat, 0);

    const last = rounded[rounded.length - 1];
    if (last !== undefined) {
      last.targets = {
        calories: Math.round((dailyTargets.calories - sumCalories) * 100) / 100,
        protein: Math.round((dailyTargets.protein - sumProtein) * 100) / 100,
        carbs: Math.round((dailyTargets.carbs - sumCarbs) * 100) / 100,
        fat: Math.round((dailyTargets.fat - sumFat) * 100) / 100,
      };
    }
  }

  return rounded as SlotAllocation[];
}
