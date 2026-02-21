"""Tests for slot allocator — ported from TypeScript."""

import pytest

from app.engine.constants import DEFAULT_SLOT_PERCENTAGES
from app.engine.slot_allocator import allocate_slots
from app.engine.types import MacroTargets

daily_targets = MacroTargets(calories=2000, protein=150, carbs=200, fat=65)


class TestAllocateSlots:
    def test_distributes_macros_proportionally(self) -> None:
        allocations = allocate_slots(daily_targets, DEFAULT_SLOT_PERCENTAGES)
        assert len(allocations) == 4

        breakfast = next(a for a in allocations if a.slot == "breakfast")
        assert breakfast.percentage == 0.25
        assert breakfast.targets.calories == pytest.approx(500, abs=0.1)
        assert breakfast.targets.protein == pytest.approx(37.5, abs=0.1)

    def test_allocated_macros_sum_to_daily_targets(self) -> None:
        allocations = allocate_slots(daily_targets, DEFAULT_SLOT_PERCENTAGES)

        total_cal = sum(a.targets.calories for a in allocations)
        total_protein = sum(a.targets.protein for a in allocations)
        total_carbs = sum(a.targets.carbs for a in allocations)
        total_fat = sum(a.targets.fat for a in allocations)

        assert total_cal == pytest.approx(daily_targets.calories, abs=0.1)
        assert total_protein == pytest.approx(daily_targets.protein, abs=0.1)
        assert total_carbs == pytest.approx(daily_targets.carbs, abs=0.1)
        assert total_fat == pytest.approx(daily_targets.fat, abs=0.1)

    def test_single_slot_gets_all(self) -> None:
        allocations = allocate_slots(daily_targets, [{"slot": "lunch", "percentage": 1.0}])
        assert len(allocations) == 1
        assert allocations[0].targets.calories == pytest.approx(daily_targets.calories, abs=0.1)
        assert allocations[0].targets.protein == pytest.approx(daily_targets.protein, abs=0.1)

    def test_throws_when_percentages_dont_sum_to_1(self) -> None:
        with pytest.raises(ValueError):
            allocate_slots(daily_targets, [
                {"slot": "breakfast", "percentage": 0.25},
                {"slot": "lunch", "percentage": 0.25},
            ])

    def test_lunch_at_35_percent(self) -> None:
        allocations = allocate_slots(daily_targets, DEFAULT_SLOT_PERCENTAGES)
        lunch = next(a for a in allocations if a.slot == "lunch")
        assert lunch.percentage == 0.35
        assert lunch.targets.calories == pytest.approx(700, abs=0.1)
        assert lunch.targets.protein == pytest.approx(52.5, abs=0.1)
        assert lunch.targets.carbs == pytest.approx(70, abs=0.1)
        assert lunch.targets.fat == pytest.approx(22.75, abs=0.1)

    def test_two_equal_slots(self) -> None:
        slots = [
            {"slot": "lunch", "percentage": 0.5},
            {"slot": "dinner", "percentage": 0.5},
        ]
        allocations = allocate_slots(daily_targets, slots)
        assert allocations[0].targets.calories == pytest.approx(1000, abs=0.1)
        assert allocations[1].targets.calories == pytest.approx(1000, abs=0.1)
        total = sum(a.targets.calories for a in allocations)
        assert total == pytest.approx(daily_targets.calories, abs=0.1)
