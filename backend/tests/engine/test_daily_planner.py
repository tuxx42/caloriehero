"""Tests for daily planner — ported from TypeScript."""

import pytest

from app.engine.constants import DEFAULT_SLOT_PERCENTAGES
from app.engine.daily_planner import generate_daily_plan
from app.engine.types import PlanRequest
from tests.engine.fixtures import (
    all_meals,
    cutting_targets,
    keto_targets,
    maintenance_targets,
)


def _make_request(**overrides: object) -> PlanRequest:
    defaults = {
        "daily_targets": maintenance_targets,
        "slots": DEFAULT_SLOT_PERCENTAGES,
        "allergies": [],
        "dietary_preferences": [],
    }
    defaults.update(overrides)
    return PlanRequest(**defaults)  # type: ignore[arg-type]


class TestGenerateDailyPlan:
    def test_valid_plan_for_maintenance(self) -> None:
        result = generate_daily_plan(all_meals, _make_request())
        assert result is not None
        assert len(result.items) == 4
        assert 0 <= result.total_score <= 1

    def test_includes_one_item_per_slot(self) -> None:
        result = generate_daily_plan(all_meals, _make_request())
        assert result is not None
        slots = [i.slot for i in result.items]
        assert "breakfast" in slots
        assert "lunch" in slots
        assert "dinner" in slots
        assert "snack" in slots

    def test_each_item_score_between_0_and_1(self) -> None:
        result = generate_daily_plan(all_meals, _make_request())
        assert result is not None
        for item in result.items:
            assert 0 <= item.score <= 1

    def test_respects_allergen_constraints(self) -> None:
        result = generate_daily_plan(
            all_meals,
            _make_request(allergies=["fish", "dairy"]),
        )
        assert result is not None
        for item in result.items:
            assert "fish" not in item.meal.allergens
            assert "dairy" not in item.meal.allergens

    def test_returns_none_for_empty_meals(self) -> None:
        assert generate_daily_plan([], _make_request()) is None

    def test_actual_macros_sum_of_selected_meals(self) -> None:
        result = generate_daily_plan(all_meals, _make_request())
        assert result is not None

        sum_cal = sum(i.meal.nutritional_info.calories for i in result.items)
        sum_protein = sum(i.meal.nutritional_info.protein for i in result.items)
        sum_carbs = sum(i.meal.nutritional_info.carbs for i in result.items)
        sum_fat = sum(i.meal.nutritional_info.fat for i in result.items)

        assert result.actual_macros.calories == pytest.approx(sum_cal, abs=1e-5)
        assert result.actual_macros.protein == pytest.approx(sum_protein, abs=1e-5)
        assert result.actual_macros.carbs == pytest.approx(sum_carbs, abs=1e-5)
        assert result.actual_macros.fat == pytest.approx(sum_fat, abs=1e-5)

    def test_target_macros_matches_request(self) -> None:
        result = generate_daily_plan(all_meals, _make_request())
        assert result is not None
        assert result.target_macros == maintenance_targets

    def test_keto_profile_lower_carbs(self) -> None:
        result = generate_daily_plan(
            all_meals,
            _make_request(daily_targets=keto_targets, dietary_preferences=["keto"]),
        )
        if result is not None:
            assert result.actual_macros.carbs < keto_targets.carbs * 3

    def test_both_profiles_valid_scores(self) -> None:
        r1 = generate_daily_plan(all_meals, _make_request())
        r2 = generate_daily_plan(all_meals, _make_request(daily_targets=cutting_targets))
        assert r1 is not None
        assert r2 is not None
        assert 0 <= r1.total_score <= 1
        assert 0 <= r2.total_score <= 1

    def test_slot_targets_sum_to_daily(self) -> None:
        result = generate_daily_plan(all_meals, _make_request())
        assert result is not None
        total_cal = sum(i.slot_targets.calories for i in result.items)
        assert total_cal == pytest.approx(maintenance_targets.calories, abs=0.1)
