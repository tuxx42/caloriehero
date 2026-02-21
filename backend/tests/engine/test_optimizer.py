"""Tests for optimizer — ported from TypeScript."""

import pytest

from app.engine.constants import DEFAULT_SLOT_PERCENTAGES
from app.engine.optimizer import find_optimal_plan
from app.engine.scoring import calculate_score
from app.engine.slot_allocator import allocate_slots
from app.engine.types import MacroTargets, Meal, MealSlot, NutritionalInfo
from tests.engine.fixtures import (
    breakfast_meals,
    dinner_meals,
    lunch_meals,
    maintenance_targets,
    snack_meals,
)


def _make_meal(
    id: str, slot: MealSlot, cals: float, protein: float, carbs: float, fat: float,
) -> Meal:
    return Meal(
        id=id,
        name=f"Test Meal {id}",
        description="Test meal",
        category=slot,
        nutritional_info=NutritionalInfo(calories=cals, protein=protein, carbs=carbs, fat=fat),
        serving_size="300g",
        price=100,
        allergens=[],
        dietary_tags=[],
        active=True,
    )


class TestFindOptimalPlan:
    def test_returns_none_no_slots(self) -> None:
        assert find_optimal_plan([], {}) is None

    def test_returns_none_when_slot_has_no_meals(self) -> None:
        allocs = allocate_slots(maintenance_targets, DEFAULT_SLOT_PERCENTAGES)
        meals_by_slot: dict[MealSlot, list[Meal]] = {
            "breakfast": breakfast_meals,
            "lunch": lunch_meals,
            "dinner": dinner_meals,
            "snack": [],  # no snack meals
        }
        assert find_optimal_plan(allocs, meals_by_slot) is None

    def test_trivial_one_meal_per_slot(self) -> None:
        allocs = allocate_slots(maintenance_targets, [{"slot": "breakfast", "percentage": 1.0}])
        meal = breakfast_meals[0]
        result = find_optimal_plan(allocs, {"breakfast": [meal]})
        assert result is not None
        assert len(result.items) == 1
        assert result.items[0].meal.id == meal.id

    def test_finds_known_optimal_single_slot(self) -> None:
        slot_targets = MacroTargets(calories=500, protein=40, carbs=50, fat=15)
        perfect = _make_meal("perfect-id-0000-0000-0000-000000000001", "lunch", 500, 40, 50, 15)
        bad = _make_meal("bad-meal-id-0000-0000-0000-000000000002", "lunch", 200, 10, 80, 5)

        from app.engine.types import SlotAllocation
        allocs = [SlotAllocation(slot="lunch", percentage=1.0, targets=slot_targets)]

        result = find_optimal_plan(allocs, {"lunch": [perfect, bad]})
        assert result is not None
        assert result.items[0].meal.id == "perfect-id-0000-0000-0000-000000000001"
        assert result.total_score == 1.0

    def test_finds_optimal_two_slots(self) -> None:
        from app.engine.types import SlotAllocation

        bf_target = MacroTargets(calories=300, protein=20, carbs=30, fat=10)
        lunch_target = MacroTargets(calories=500, protein=40, carbs=50, fat=15)

        good_bf = _make_meal("good-bf-id-0000-0000-000000000001", "breakfast", 300, 20, 30, 10)
        bad_bf = _make_meal("bad-bf-id-00-0000-0000-000000000002", "breakfast", 600, 5, 80, 25)
        good_lunch = _make_meal("good-ln-id-0000-0000-000000000003", "lunch", 500, 40, 50, 15)
        bad_lunch = _make_meal("bad-ln-id-00-0000-0000-000000000004", "lunch", 100, 5, 10, 2)

        allocs = [
            SlotAllocation(slot="breakfast", percentage=0.4, targets=bf_target),
            SlotAllocation(slot="lunch", percentage=0.6, targets=lunch_target),
        ]

        result = find_optimal_plan(allocs, {
            "breakfast": [good_bf, bad_bf],
            "lunch": [good_lunch, bad_lunch],
        })
        assert result is not None
        bf_item = next(i for i in result.items if i.slot == "breakfast")
        lunch_item = next(i for i in result.items if i.slot == "lunch")
        assert bf_item.meal.id == "good-bf-id-0000-0000-000000000001"
        assert lunch_item.meal.id == "good-ln-id-0000-0000-000000000003"

    def test_matches_brute_force(self) -> None:
        slots = [
            {"slot": "breakfast", "percentage": 0.33},
            {"slot": "lunch", "percentage": 0.34},
            {"slot": "dinner", "percentage": 0.33},
        ]
        allocs = allocate_slots(maintenance_targets, slots)

        meals_by_slot: dict[MealSlot, list[Meal]] = {
            "breakfast": breakfast_meals[:3],
            "lunch": lunch_meals[:3],
            "dinner": dinner_meals[:3],
        }

        optimizer_result = find_optimal_plan(allocs, meals_by_slot)
        assert optimizer_result is not None

        # Brute force: 3*3*3 = 27 combinations
        brute_force_score = -1.0
        for bf in meals_by_slot["breakfast"]:
            for lm in meals_by_slot["lunch"]:
                for dm in meals_by_slot["dinner"]:
                    bf_s = calculate_score(bf.nutritional_info, allocs[0].targets)
                    l_s = calculate_score(lm.nutritional_info, allocs[1].targets)
                    d_s = calculate_score(dm.nutritional_info, allocs[2].targets)
                    total = (bf_s + l_s + d_s) / 3
                    if total > brute_force_score:
                        brute_force_score = total

        assert optimizer_result.total_score == pytest.approx(brute_force_score, abs=1e-8)

    def test_full_4_slot_catalog(self) -> None:
        allocs = allocate_slots(maintenance_targets, DEFAULT_SLOT_PERCENTAGES)
        meals_by_slot: dict[MealSlot, list[Meal]] = {
            "breakfast": breakfast_meals,
            "lunch": lunch_meals,
            "dinner": dinner_meals,
            "snack": snack_meals,
        }
        result = find_optimal_plan(allocs, meals_by_slot)
        assert result is not None
        assert len(result.items) == 4
        assert 0 <= result.total_score <= 1

    def test_total_score_is_average(self) -> None:
        allocs = allocate_slots(maintenance_targets, [
            {"slot": "breakfast", "percentage": 0.5},
            {"slot": "lunch", "percentage": 0.5},
        ])
        meals_by_slot: dict[MealSlot, list[Meal]] = {
            "breakfast": [breakfast_meals[0]],
            "lunch": [lunch_meals[0]],
        }
        result = find_optimal_plan(allocs, meals_by_slot)
        assert result is not None
        avg = sum(i.score for i in result.items) / len(result.items)
        assert result.total_score == pytest.approx(avg, abs=1e-10)

    def test_single_meal_per_slot_all_4(self) -> None:
        allocs = allocate_slots(maintenance_targets, DEFAULT_SLOT_PERCENTAGES)
        meals_by_slot: dict[MealSlot, list[Meal]] = {
            "breakfast": [breakfast_meals[0]],
            "lunch": [lunch_meals[0]],
            "dinner": [dinner_meals[0]],
            "snack": [snack_meals[0]],
        }
        result = find_optimal_plan(allocs, meals_by_slot)
        assert result is not None
        assert len(result.items) == 4
        bf = next(i for i in result.items if i.slot == "breakfast")
        assert bf.meal.id == breakfast_meals[0].id
