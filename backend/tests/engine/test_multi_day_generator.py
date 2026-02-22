"""Tests for multi-day plan generator."""

from app.engine.constants import DEFAULT_SLOT_PERCENTAGES
from app.engine.multi_day_generator import generate_multi_day_plan
from app.engine.types import PlanRequest
from tests.engine.fixtures import (
    all_meals,
    make_meal,
    maintenance_targets,
    NutritionalInfo,
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


class TestGenerateMultiDayPlan:
    def test_generates_requested_number_of_days(self) -> None:
        result = generate_multi_day_plan(all_meals, _make_request(), num_days=5)
        assert len(result.days) == 5
        for i, day in enumerate(result.days):
            assert day.day == i + 1

    def test_no_repeats_when_pool_sufficient(self) -> None:
        """With 8 breakfast, 10 lunch, 8 dinner, 6 snack — first few days should be unique."""
        result = generate_multi_day_plan(all_meals, _make_request(), num_days=4)
        assert not result.has_repeats
        assert result.total_repeated_meals == 0
        for day in result.days:
            assert day.repeated_meal_ids == []

    def test_falls_back_with_repeats_when_pool_exhausted(self) -> None:
        """With limited meals, repeats should be flagged."""
        # Create a minimal pool: 2 meals per category
        small_pool = [
            make_meal("sb1", "B1", "breakfast", NutritionalInfo(calories=400, protein=20, carbs=50, fat=10)),
            make_meal("sb2", "B2", "breakfast", NutritionalInfo(calories=350, protein=18, carbs=45, fat=8)),
            make_meal("sl1", "L1", "lunch", NutritionalInfo(calories=500, protein=35, carbs=50, fat=15)),
            make_meal("sl2", "L2", "lunch", NutritionalInfo(calories=480, protein=30, carbs=55, fat=12)),
            make_meal("sd1", "D1", "dinner", NutritionalInfo(calories=550, protein=40, carbs=45, fat=20)),
            make_meal("sd2", "D2", "dinner", NutritionalInfo(calories=520, protein=38, carbs=50, fat=18)),
            make_meal("ss1", "S1", "snack", NutritionalInfo(calories=200, protein=10, carbs=20, fat=8)),
            make_meal("ss2", "S2", "snack", NutritionalInfo(calories=180, protein=12, carbs=18, fat=6)),
        ]
        # 2 meals per category → day 3 must repeat
        result = generate_multi_day_plan(small_pool, _make_request(), num_days=4)
        assert result.has_repeats
        assert result.total_repeated_meals > 0

    def test_repeated_meal_ids_are_accurate(self) -> None:
        """Repeated meal IDs should reference meals that appeared in earlier days."""
        small_pool = [
            make_meal("rb1", "B1", "breakfast", NutritionalInfo(calories=400, protein=20, carbs=50, fat=10)),
            make_meal("rl1", "L1", "lunch", NutritionalInfo(calories=500, protein=35, carbs=50, fat=15)),
            make_meal("rd1", "D1", "dinner", NutritionalInfo(calories=550, protein=40, carbs=45, fat=20)),
            make_meal("rs1", "S1", "snack", NutritionalInfo(calories=200, protein=10, carbs=20, fat=8)),
        ]
        # Only 1 meal per category → day 2 must fully repeat
        result = generate_multi_day_plan(small_pool, _make_request(), num_days=3)
        assert len(result.days) >= 2

        # Day 1 should have no repeats
        assert result.days[0].repeated_meal_ids == []

        # Day 2+ should have repeated meal IDs that come from day 1
        day1_meal_ids = {item.meal.id for item in result.days[0].plan.items}
        for day in result.days[1:]:
            for repeated_id in day.repeated_meal_ids:
                assert repeated_id in day1_meal_ids

    def test_each_day_has_valid_plan(self) -> None:
        result = generate_multi_day_plan(all_meals, _make_request(), num_days=7)
        for day in result.days:
            assert len(day.plan.items) == 4
            assert 0 <= day.plan.total_score <= 1
            slots = {item.slot for item in day.plan.items}
            assert slots == {"breakfast", "lunch", "dinner", "snack"}

    def test_aggregate_stats_correct(self) -> None:
        result = generate_multi_day_plan(all_meals, _make_request(), num_days=5)
        # Count unique meals across all days
        all_meal_ids: set[str] = set()
        total_repeated = 0
        for day in result.days:
            for item in day.plan.items:
                all_meal_ids.add(item.meal.id)
            total_repeated += len(day.repeated_meal_ids)

        assert result.total_unique_meals == len(all_meal_ids)
        assert result.total_repeated_meals == total_repeated

    def test_single_day_no_repeats(self) -> None:
        result = generate_multi_day_plan(all_meals, _make_request(), num_days=1)
        assert len(result.days) == 1
        assert not result.has_repeats
        assert result.total_repeated_meals == 0

    def test_stops_generating_when_even_fallback_fails(self) -> None:
        """With empty meals, should return 0 days."""
        result = generate_multi_day_plan([], _make_request(), num_days=5)
        assert len(result.days) == 0
        assert result.total_unique_meals == 0
        assert result.total_repeated_meals == 0
