"""Edge case tests — ported from TypeScript."""

import pytest

from app.engine.constants import DEFAULT_SLOT_PERCENTAGES
from app.engine.daily_planner import generate_daily_plan
from app.engine.per_meal_matcher import match_meals
from app.engine.scoring import calculate_score
from app.engine.slot_allocator import allocate_slots
from app.engine.types import MacroTargets, MealMatchRequest, NutritionalInfo, PlanRequest
from tests.engine.fixtures import all_meals, maintenance_targets


class TestEdgeCases:
    def test_match_meals_empty_array(self) -> None:
        request = MealMatchRequest(
            targets=maintenance_targets,
            allergies=[],
            dietary_preferences=[],
            limit=10,
        )
        assert match_meals([], request) == []

    def test_match_meals_single_meal(self) -> None:
        single = [all_meals[0]]
        request = MealMatchRequest(
            targets=maintenance_targets,
            allergies=[],
            dietary_preferences=[],
            limit=10,
        )
        result = match_meals(single, request)
        assert len(result) == 1
        assert result[0].meal.id == single[0].id

    def test_daily_plan_empty_meals(self) -> None:
        request = PlanRequest(
            daily_targets=maintenance_targets,
            slots=DEFAULT_SLOT_PERCENTAGES,
            allergies=[],
            dietary_preferences=[],
        )
        assert generate_daily_plan([], request) is None

    def test_scoring_near_zero_target(self) -> None:
        target = MacroTargets(calories=1, protein=0, carbs=0, fat=0)
        ni = NutritionalInfo(calories=1, protein=0, carbs=0, fat=0)
        score = calculate_score(ni, target)
        assert score == 1.0

    def test_allocate_extreme_percentages_still_sums(self) -> None:
        slots = [
            {"slot": "breakfast", "percentage": 0.499},
            {"slot": "snack", "percentage": 0.501},
        ]
        allocations = allocate_slots(maintenance_targets, slots)
        total = sum(a.targets.calories for a in allocations)
        assert total == pytest.approx(maintenance_targets.calories, abs=0.1)

    def test_daily_plan_single_slot(self) -> None:
        request = PlanRequest(
            daily_targets=maintenance_targets,
            slots=[{"slot": "lunch", "percentage": 1.0}],
            allergies=[],
            dietary_preferences=[],
        )
        result = generate_daily_plan(all_meals, request)
        assert result is not None
        assert len(result.items) == 1
        assert result.items[0].slot == "lunch"
