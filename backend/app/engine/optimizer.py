"""Branch-and-bound optimizer for finding optimal meal combinations across slots."""

from app.engine.constants import DEFAULT_SCORING_WEIGHTS
from app.engine.scoring import calculate_score
from app.engine.types import (
    Meal,
    MealSlot,
    OptimalPlan,
    OptimalPlanItem,
    ScoringWeights,
    SlotAllocation,
)


def find_optimal_plan(
    slot_allocations: list[SlotAllocation],
    meals_by_slot: dict[MealSlot, list[Meal]],
    weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
) -> OptimalPlan | None:
    """Find the optimal combination of meals across slots maximizing total weighted score.

    Algorithm: branch-and-bound in slot order.
    - Meals pre-sorted by slot-specific score (desc) to explore promising branches first.
    - Pruning: if running score + theoretical max remaining can't beat current best, prune.

    Returns None when no meals are available for any required slot.
    """
    if not slot_allocations:
        return None

    # Pre-score and sort meals for each slot
    ranked_by_slot: list[dict[str, object]] = []
    for allocation in slot_allocations:
        slot_meals = meals_by_slot.get(allocation.slot, [])
        scored = [
            {
                "meal": meal,
                "score": calculate_score(meal.nutritional_info, allocation.targets, weights),
            }
            for meal in slot_meals
        ]
        scored.sort(key=lambda x: (-x["score"], x["meal"].id))  # type: ignore[union-attr]
        ranked_by_slot.append({"slot": allocation.slot, "meals": scored})

    # Verify every slot has at least one meal
    for slot_data in ranked_by_slot:
        if not slot_data["meals"]:  # type: ignore[arg-type]
            return None

    num_slots = len(ranked_by_slot)
    best_score = -1.0
    best_items: list[OptimalPlanItem] | None = None

    current_items: list[OptimalPlanItem] = []
    running_score = 0.0

    def search(slot_index: int) -> None:
        nonlocal best_score, best_items, running_score

        if slot_index == num_slots:
            total_score = running_score / num_slots
            if total_score > best_score:
                best_score = total_score
                best_items = list(current_items)
            return

        # Upper-bound pruning
        remaining_slots = num_slots - slot_index
        upper_bound = (running_score + remaining_slots) / num_slots
        if upper_bound <= best_score + 1e-12:
            return

        slot_data = ranked_by_slot[slot_index]
        slot_name: MealSlot = slot_data["slot"]  # type: ignore[assignment]
        slot_meals: list[dict[str, object]] = slot_data["meals"]  # type: ignore[assignment]

        for entry in slot_meals:
            meal: Meal = entry["meal"]  # type: ignore[assignment]
            score: float = entry["score"]  # type: ignore[assignment]

            # Within-slot pruning
            upper_bound_with_meal = (running_score + score + remaining_slots - 1) / num_slots
            if upper_bound_with_meal <= best_score + 1e-12:
                break

            running_score += score
            current_items.append(OptimalPlanItem(slot=slot_name, meal=meal, score=score))

            search(slot_index + 1)

            current_items.pop()
            running_score -= score

            # Early exit on perfect solution
            if best_score >= 1.0:
                return

    search(0)

    if best_items is None:
        return None

    return OptimalPlan(items=best_items, total_score=best_score)
