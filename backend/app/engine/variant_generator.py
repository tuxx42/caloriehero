"""Generate multiple diverse plan variants by excluding previously used meals."""

from app.engine.daily_planner import generate_daily_plan
from app.engine.types import Meal, PlanRequest, PlanResult


def generate_plan_variants(
    meals: list[Meal],
    request: PlanRequest,
    count: int = 3,
) -> list[PlanResult]:
    """Generate up to `count` diverse daily plan variants.

    Each variant excludes meals used in prior variants to ensure diversity.
    May return fewer than `count` if insufficient meals remain.
    """
    variants: list[PlanResult] = []
    used_meal_ids: set[str] = set()

    for _ in range(count):
        available = [m for m in meals if m.id not in used_meal_ids]
        result = generate_daily_plan(available, request)
        if result is None:
            break
        variants.append(result)
        used_meal_ids.update(item.meal.id for item in result.items)

    return variants
