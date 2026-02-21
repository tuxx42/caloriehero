"""Per-meal matching pipeline: filter -> score -> sort -> top N."""

from app.engine.constants import DEFAULT_SCORING_WEIGHTS
from app.engine.filters import filter_meals
from app.engine.scoring import calculate_deviation, calculate_score
from app.engine.types import Meal, MealMatchRequest, ScoredMeal


def match_meals(meals: list[Meal], request: MealMatchRequest) -> list[ScoredMeal]:
    """Full per-meal matching pipeline.

    1. Filter meals by allergens, dietary preferences, and category
    2. Score each meal against the macro targets
    3. Sort by score descending (deterministic with id tiebreak)
    4. Apply limit
    """
    effective_weights = request.weights or DEFAULT_SCORING_WEIGHTS

    # Step 1: Filter
    filtered = filter_meals(
        meals,
        allergies=request.allergies,
        dietary_preferences=request.dietary_preferences,
        category=request.category,
    )

    # Step 2: Score
    scored = [
        ScoredMeal(
            meal=meal,
            score=calculate_score(meal.nutritional_info, request.targets, effective_weights),
            deviation=calculate_deviation(meal.nutritional_info, request.targets),
        )
        for meal in filtered
    ]

    # Step 3: Sort by score descending, tiebreak by id
    scored.sort(key=lambda s: (-s.score, s.meal.id))

    # Step 4: Apply limit
    return scored[: request.limit]
