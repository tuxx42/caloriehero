"""Tests for the variant generator engine module."""

from app.engine.constants import DEFAULT_SLOT_PERCENTAGES
from app.engine.types import (
    Meal,
    MacroTargets,
    NutritionalInfo,
    PlanRequest,
)
from app.engine.variant_generator import generate_plan_variants


def _make_meal(id: str, name: str, category: str, calories: float = 400) -> Meal:
    return Meal(
        id=id,
        name=name,
        description=f"Test {name}",
        category=category,
        nutritional_info=NutritionalInfo(
            calories=calories, protein=30, carbs=40, fat=10
        ),
        serving_size="300g",
        price=100,
    )


def _make_request() -> PlanRequest:
    return PlanRequest(
        daily_targets=MacroTargets(calories=2000, protein=150, carbs=200, fat=65),
        slots=DEFAULT_SLOT_PERCENTAGES,
    )


class TestGeneratePlanVariants:
    def test_generates_multiple_variants(self) -> None:
        """Should generate 3 variants when enough meals exist."""
        meals = [
            # 3 meals per slot = enough for 3 variants
            _make_meal("b1", "Oats 1", "breakfast"),
            _make_meal("b2", "Oats 2", "breakfast"),
            _make_meal("b3", "Oats 3", "breakfast"),
            _make_meal("l1", "Chicken 1", "lunch"),
            _make_meal("l2", "Chicken 2", "lunch"),
            _make_meal("l3", "Chicken 3", "lunch"),
            _make_meal("d1", "Fish 1", "dinner"),
            _make_meal("d2", "Fish 2", "dinner"),
            _make_meal("d3", "Fish 3", "dinner"),
            _make_meal("s1", "Bar 1", "snack"),
            _make_meal("s2", "Bar 2", "snack"),
            _make_meal("s3", "Bar 3", "snack"),
        ]
        variants = generate_plan_variants(meals, _make_request(), count=3)
        assert len(variants) == 3

    def test_variants_use_different_meals(self) -> None:
        """Variants should not share any meals."""
        meals = [
            _make_meal("b1", "Oats 1", "breakfast"),
            _make_meal("b2", "Oats 2", "breakfast"),
            _make_meal("b3", "Oats 3", "breakfast"),
            _make_meal("l1", "Chicken 1", "lunch"),
            _make_meal("l2", "Chicken 2", "lunch"),
            _make_meal("l3", "Chicken 3", "lunch"),
            _make_meal("d1", "Fish 1", "dinner"),
            _make_meal("d2", "Fish 2", "dinner"),
            _make_meal("d3", "Fish 3", "dinner"),
            _make_meal("s1", "Bar 1", "snack"),
            _make_meal("s2", "Bar 2", "snack"),
            _make_meal("s3", "Bar 3", "snack"),
        ]
        variants = generate_plan_variants(meals, _make_request(), count=3)
        all_meal_sets = [
            {item.meal.id for item in v.items} for v in variants
        ]
        # Check no overlap between any pair of variants
        for i in range(len(all_meal_sets)):
            for j in range(i + 1, len(all_meal_sets)):
                assert all_meal_sets[i].isdisjoint(all_meal_sets[j]), (
                    f"Variant {i} and {j} share meals"
                )

    def test_returns_fewer_when_not_enough_meals(self) -> None:
        """Should return fewer variants if insufficient meals."""
        meals = [
            # Only 1 meal per slot
            _make_meal("b1", "Oats", "breakfast"),
            _make_meal("l1", "Chicken", "lunch"),
            _make_meal("d1", "Fish", "dinner"),
            _make_meal("s1", "Bar", "snack"),
        ]
        variants = generate_plan_variants(meals, _make_request(), count=3)
        assert len(variants) == 1

    def test_returns_empty_when_no_meals(self) -> None:
        """Should return empty list when no meals available."""
        variants = generate_plan_variants([], _make_request(), count=3)
        assert variants == []

    def test_each_variant_is_valid_plan(self) -> None:
        """Each variant should have 4 items covering all slots."""
        meals = [
            _make_meal("b1", "Oats 1", "breakfast"),
            _make_meal("b2", "Oats 2", "breakfast"),
            _make_meal("l1", "Chicken 1", "lunch"),
            _make_meal("l2", "Chicken 2", "lunch"),
            _make_meal("d1", "Fish 1", "dinner"),
            _make_meal("d2", "Fish 2", "dinner"),
            _make_meal("s1", "Bar 1", "snack"),
            _make_meal("s2", "Bar 2", "snack"),
        ]
        variants = generate_plan_variants(meals, _make_request(), count=2)
        for variant in variants:
            assert len(variant.items) == 4
            slots = {item.slot for item in variant.items}
            assert slots == {"breakfast", "lunch", "dinner", "snack"}
            assert variant.total_score > 0
