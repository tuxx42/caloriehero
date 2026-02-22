"""Multi-day plan generator: loops daily planner with progressive meal exclusion."""

from app.engine.daily_planner import generate_daily_plan
from app.engine.types import (
    DayPlanResult,
    Meal,
    MultiDayPlanResult,
    PlanRequest,
)


def generate_multi_day_plan(
    meals: list[Meal],
    request: PlanRequest,
    num_days: int,
) -> MultiDayPlanResult:
    """Generate a meal plan spanning multiple days.

    Algorithm:
    1. Loop num_days times, tracking used_meal_ids across days
    2. Filter out used meals, call generate_daily_plan(available, request)
    3. If None (pool exhausted), fallback to full pool, record repeated_meal_ids
    4. Return MultiDayPlanResult with per-day repeat info + aggregate stats
    """
    used_meal_ids: set[str] = set()
    all_seen_meal_ids: set[str] = set()
    total_repeated = 0
    day_results: list[DayPlanResult] = []

    for day_num in range(1, num_days + 1):
        # Try with unused meals first
        available = [m for m in meals if m.id not in used_meal_ids]
        plan = generate_daily_plan(available, request)

        repeated_meal_ids: list[str] = []

        if plan is None:
            # Fallback: use full pool
            plan = generate_daily_plan(meals, request)
            if plan is None:
                # Even full pool fails — stop generating
                break
            # All meals from this plan that were already used are repeats
            repeated_meal_ids = [
                item.meal.id for item in plan.items
                if item.meal.id in used_meal_ids
            ]
        else:
            # Check if any meals ended up being repeats
            # (shouldn't happen since we filtered, but be safe)
            repeated_meal_ids = [
                item.meal.id for item in plan.items
                if item.meal.id in used_meal_ids
            ]

        # Track used meals
        day_meal_ids = {item.meal.id for item in plan.items}
        used_meal_ids.update(day_meal_ids)
        all_seen_meal_ids.update(day_meal_ids)
        total_repeated += len(repeated_meal_ids)

        day_results.append(DayPlanResult(
            day=day_num,
            plan=plan,
            repeated_meal_ids=repeated_meal_ids,
        ))

    return MultiDayPlanResult(
        days=day_results,
        total_unique_meals=len(all_seen_meal_ids),
        total_repeated_meals=total_repeated,
    )
