"""Meal filtering functions."""

from app.engine.types import Meal


def filter_by_allergens(meals: list[Meal], allergies: list[str]) -> list[Meal]:
    """Remove meals containing any of the listed allergens."""
    if not allergies:
        return meals
    allergen_set = set(allergies)
    return [m for m in meals if not any(a in allergen_set for a in m.allergens)]


def filter_by_dietary_tags(meals: list[Meal], preferences: list[str]) -> list[Meal]:
    """Keep only meals that have ALL listed dietary tags (AND logic)."""
    if not preferences:
        return meals
    return [m for m in meals if all(tag in m.dietary_tags for tag in preferences)]


def filter_by_category(meals: list[Meal], category: str) -> list[Meal]:
    """Keep only meals belonging to the given category."""
    return [m for m in meals if m.category == category]


def filter_meals(
    meals: list[Meal],
    allergies: list[str] | None = None,
    dietary_preferences: list[str] | None = None,
    category: str | None = None,
) -> list[Meal]:
    """Run all applicable filters in sequence: allergens -> dietary tags -> category."""
    result = meals

    if allergies:
        result = filter_by_allergens(result, allergies)

    if dietary_preferences:
        result = filter_by_dietary_tags(result, dietary_preferences)

    if category is not None:
        result = filter_by_category(result, category)

    return result
