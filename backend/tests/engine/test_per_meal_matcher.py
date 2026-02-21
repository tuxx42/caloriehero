"""Tests for per-meal matcher — ported from TypeScript."""

from app.engine.per_meal_matcher import match_meals
from app.engine.types import MealMatchRequest
from tests.engine.fixtures import all_meals, maintenance_targets


def _make_request(**overrides: object) -> MealMatchRequest:
    defaults = {
        "targets": maintenance_targets,
        "allergies": [],
        "dietary_preferences": [],
        "limit": 10,
    }
    defaults.update(overrides)
    return MealMatchRequest(**defaults)  # type: ignore[arg-type]


class TestMatchMeals:
    def test_sorted_by_score_descending(self) -> None:
        results = match_meals(all_meals, _make_request())
        for i in range(1, len(results)):
            assert results[i - 1].score >= results[i].score

    def test_respects_limit(self) -> None:
        results = match_meals(all_meals, _make_request(limit=3))
        assert len(results) == 3

    def test_at_most_n_results(self) -> None:
        results = match_meals(all_meals, _make_request(limit=1000))
        assert len(results) <= len(all_meals)

    def test_filters_by_category(self) -> None:
        results = match_meals(all_meals, _make_request(category="breakfast"))
        for item in results:
            assert item.meal.category == "breakfast"
        assert len(results) > 0

    def test_applies_allergen_filtering(self) -> None:
        results = match_meals(all_meals, _make_request(allergies=["fish"]))
        for item in results:
            assert "fish" not in item.meal.allergens

    def test_restrictive_dietary_preferences(self) -> None:
        results = match_meals(
            all_meals,
            _make_request(dietary_preferences=["keto", "vegan", "high_protein", "halal"]),
        )
        for item in results:
            assert "keto" in item.meal.dietary_tags
            assert "vegan" in item.meal.dietary_tags
            assert "high_protein" in item.meal.dietary_tags
            assert "halal" in item.meal.dietary_tags

    def test_empty_meals_returns_empty(self) -> None:
        results = match_meals([], _make_request())
        assert results == []

    def test_scores_between_0_and_1(self) -> None:
        results = match_meals(all_meals, _make_request())
        for item in results:
            assert 0 <= item.score <= 1

    def test_deviation_structure(self) -> None:
        results = match_meals(all_meals, _make_request(limit=5))
        for item in results:
            assert isinstance(item.deviation.calories, (int, float))
            assert isinstance(item.deviation.protein, (int, float))
            assert isinstance(item.deviation.carbs, (int, float))
            assert isinstance(item.deviation.fat, (int, float))
            assert item.deviation.calories >= 0
            assert item.deviation.protein >= 0
            assert item.deviation.carbs >= 0
            assert item.deviation.fat >= 0
