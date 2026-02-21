"""Scoring functions for macro matching."""

from app.engine.constants import DEFAULT_SCORING_WEIGHTS
from app.engine.types import MacroDeviation, MacroTargets, NutritionalInfo, ScoringWeights


def calculate_deviation(actual: NutritionalInfo, target: MacroTargets) -> MacroDeviation:
    """Absolute per-macro deviation between actual nutritional info and target macros."""
    return MacroDeviation(
        calories=abs(actual.calories - target.calories),
        protein=abs(actual.protein - target.protein),
        carbs=abs(actual.carbs - target.carbs),
        fat=abs(actual.fat - target.fat),
    )


def _score_macro(actual: float, target: float) -> float:
    """Score a single macro dimension.

    - target == 0 and actual == 0 -> 1.0 (perfect)
    - target == 0 and actual > 0  -> 0.0 (penalised)
    - Otherwise: 1 - min(|actual - target| / target, 1) clamped to [0, 1]
    """
    if target == 0:
        return 1.0 if actual == 0 else 0.0
    normalized_deviation = abs(actual - target) / target
    return max(0.0, 1.0 - min(normalized_deviation, 1.0))


def calculate_score(
    actual: NutritionalInfo,
    target: MacroTargets,
    weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
) -> float:
    """Weighted 0-1 score for how well actual matches target. 1.0 = perfect."""
    macro_scores = {
        "calories": _score_macro(actual.calories, target.calories),
        "protein": _score_macro(actual.protein, target.protein),
        "carbs": _score_macro(actual.carbs, target.carbs),
        "fat": _score_macro(actual.fat, target.fat),
    }

    total_weight = weights.calories + weights.protein + weights.carbs + weights.fat

    if total_weight == 0:
        return (
            macro_scores["calories"]
            + macro_scores["protein"]
            + macro_scores["carbs"]
            + macro_scores["fat"]
        ) / 4

    weighted_sum = (
        macro_scores["calories"] * weights.calories
        + macro_scores["protein"] * weights.protein
        + macro_scores["carbs"] * weights.carbs
        + macro_scores["fat"] * weights.fat
    )

    return weighted_sum / total_weight
