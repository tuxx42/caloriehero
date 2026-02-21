"""Daily plan generator: orchestrates filtering, allocation, grouping, and optimization."""

from app.engine.constants import DEFAULT_SCORING_WEIGHTS
from app.engine.filters import filter_meals
from app.engine.optimizer import find_optimal_plan
from app.engine.slot_allocator import allocate_slots
from app.engine.types import (
    Meal,
    MealSlot,
    NutritionalInfo,
    PlanItem,
    PlanRequest,
    PlanResult,
)


def generate_daily_plan(meals: list[Meal], request: PlanRequest) -> PlanResult | None:
    """Generate an optimized daily meal plan.

    1. Filter all meals by dietary restrictions / allergens
    2. Allocate daily targets across requested slots
    3. Group filtered meals by the slot they can fill (category matches slot)
    4. Run the branch-and-bound optimizer
    5. Build and return the PlanResult

    Returns None when no valid plan can be constructed.
    """
    effective_weights = request.weights or DEFAULT_SCORING_WEIGHTS

    # Step 1: Filter meals globally
    filtered = filter_meals(
        meals,
        allergies=request.allergies,
        dietary_preferences=request.dietary_preferences,
    )

    # Step 2: Allocate slot targets
    slot_allocations = allocate_slots(request.daily_targets, request.slots)

    # Step 3: Group meals by slot (category matches slot name)
    meals_by_slot: dict[MealSlot, list[Meal]] = {}
    for allocation in slot_allocations:
        slot_meals = [m for m in filtered if m.category == allocation.slot]
        meals_by_slot[allocation.slot] = slot_meals

    # Step 4: Optimize
    optimal = find_optimal_plan(slot_allocations, meals_by_slot, effective_weights)

    if optimal is None:
        return None

    # Step 5: Build PlanResult
    allocation_map = {a.slot: a for a in slot_allocations}

    items = [
        PlanItem(
            slot=item.slot,
            meal=item.meal,
            score=item.score,
            slot_targets=allocation_map[item.slot].targets,
        )
        for item in optimal.items
    ]

    actual_macros = _sum_nutritional_info([item.meal.nutritional_info for item in optimal.items])

    return PlanResult(
        items=items,
        total_score=optimal.total_score,
        actual_macros=actual_macros,
        target_macros=request.daily_targets,
    )


def _sum_nutritional_info(infos: list[NutritionalInfo]) -> NutritionalInfo:
    """Sum nutritional info across multiple meals."""
    return NutritionalInfo(
        calories=sum(i.calories for i in infos),
        protein=sum(i.protein for i in infos),
        carbs=sum(i.carbs for i in infos),
        fat=sum(i.fat for i in infos),
    )
