"""Tests for filters module — ported from TypeScript."""

from app.engine.filters import (
    filter_by_allergens,
    filter_by_category,
    filter_by_dietary_tags,
    filter_meals,
)
from tests.engine.fixtures import all_meals, breakfast_meals, lunch_meals


class TestFilterByAllergens:
    def test_empty_allergies_returns_all(self) -> None:
        result = filter_by_allergens(all_meals, [])
        assert len(result) == len(all_meals)

    def test_removes_meals_with_allergen(self) -> None:
        result = filter_by_allergens(all_meals, ["fish"])
        for meal in result:
            assert "fish" not in meal.allergens

    def test_removes_meals_with_any_listed_allergen(self) -> None:
        result = filter_by_allergens(all_meals, ["dairy", "eggs"])
        for meal in result:
            assert "dairy" not in meal.allergens
            assert "eggs" not in meal.allergens

    def test_empty_meals_returns_empty(self) -> None:
        assert filter_by_allergens([], ["dairy"]) == []

    def test_allergen_not_present_returns_all(self) -> None:
        result = filter_by_allergens(all_meals, ["shellfish"])
        assert len(result) == len(all_meals)

    def test_multiple_allergens_more_strict(self) -> None:
        single = filter_by_allergens(all_meals, ["soy"])
        multiple = filter_by_allergens(all_meals, ["soy", "fish"])
        assert len(multiple) <= len(single)


class TestFilterByDietaryTags:
    def test_empty_preferences_returns_all(self) -> None:
        result = filter_by_dietary_tags(all_meals, [])
        assert len(result) == len(all_meals)

    def test_filters_single_tag(self) -> None:
        result = filter_by_dietary_tags(all_meals, ["keto"])
        for meal in result:
            assert "keto" in meal.dietary_tags
        assert len(result) > 0

    def test_and_logic_all_tags_required(self) -> None:
        result = filter_by_dietary_tags(all_meals, ["keto", "gluten_free"])
        for meal in result:
            assert "keto" in meal.dietary_tags
            assert "gluten_free" in meal.dietary_tags

    def test_impossible_combination(self) -> None:
        result = filter_by_dietary_tags(all_meals, ["keto", "vegan", "high_protein"])
        for meal in result:
            assert "keto" in meal.dietary_tags
            assert "vegan" in meal.dietary_tags
            assert "high_protein" in meal.dietary_tags

    def test_empty_meals_returns_empty(self) -> None:
        assert filter_by_dietary_tags([], ["vegetarian"]) == []


class TestFilterByCategory:
    def test_returns_only_specified_category(self) -> None:
        result = filter_by_category(all_meals, "breakfast")
        for meal in result:
            assert meal.category == "breakfast"
        assert len(result) == len(breakfast_meals)

    def test_filters_correctly_for_lunch(self) -> None:
        result = filter_by_category(all_meals, "lunch")
        assert len(result) == len(lunch_meals)

    def test_empty_meals_returns_empty(self) -> None:
        assert filter_by_category([], "dinner") == []


class TestFilterMealsCombined:
    def test_applies_all_filters(self) -> None:
        result = filter_meals(
            all_meals,
            allergies=["dairy"],
            dietary_preferences=["gluten_free"],
            category="breakfast",
        )
        for meal in result:
            assert meal.category == "breakfast"
            assert "dairy" not in meal.allergens
            assert "gluten_free" in meal.dietary_tags

    def test_no_opts_returns_all(self) -> None:
        result = filter_meals(all_meals)
        assert len(result) == len(all_meals)

    def test_empty_allergies_no_filter(self) -> None:
        result = filter_meals(all_meals, allergies=[])
        assert len(result) == len(all_meals)

    def test_combined_more_restrictive(self) -> None:
        by_allergen = filter_meals(all_meals, allergies=["peanuts"])
        combined = filter_meals(
            all_meals, allergies=["peanuts"], dietary_preferences=["gluten_free"],
        )
        assert len(combined) <= len(by_allergen)

    def test_empty_meals_returns_empty(self) -> None:
        result = filter_meals(
            [],
            allergies=["dairy"],
            dietary_preferences=["keto"],
            category="snack",
        )
        assert result == []
