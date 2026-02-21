"""Default constants for the meal plan engine."""

from app.engine.types import ScoringWeights, Tolerance

DEFAULT_SLOT_PERCENTAGES: list[dict[str, object]] = [
    {"slot": "breakfast", "percentage": 0.25},
    {"slot": "lunch", "percentage": 0.35},
    {"slot": "dinner", "percentage": 0.30},
    {"slot": "snack", "percentage": 0.10},
]

DEFAULT_TOLERANCE = Tolerance(
    calories=0.1,
    protein=0.15,
    carbs=0.15,
    fat=0.15,
)

DEFAULT_SCORING_WEIGHTS = ScoringWeights(
    calories=0.4,
    protein=0.3,
    carbs=0.15,
    fat=0.15,
)
