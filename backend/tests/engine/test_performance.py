"""Performance benchmark tests — ported from TypeScript."""

import time

from app.engine.constants import DEFAULT_SLOT_PERCENTAGES
from app.engine.daily_planner import generate_daily_plan
from app.engine.per_meal_matcher import match_meals
from app.engine.types import MealMatchRequest, PlanRequest
from tests.engine.fixtures import generate_large_catalog, maintenance_targets


class TestPerformance:
    def test_daily_plan_200_meals_under_100ms(self) -> None:
        catalog = generate_large_catalog(200)
        request = PlanRequest(
            daily_targets=maintenance_targets,
            slots=DEFAULT_SLOT_PERCENTAGES,
            allergies=[],
            dietary_preferences=[],
        )

        start = time.perf_counter()
        result = generate_daily_plan(catalog, request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert result is not None
        assert elapsed_ms < 100

    def test_daily_plan_50_meals_under_50ms(self) -> None:
        catalog = generate_large_catalog(50)
        request = PlanRequest(
            daily_targets=maintenance_targets,
            slots=DEFAULT_SLOT_PERCENTAGES,
            allergies=[],
            dietary_preferences=[],
        )

        start = time.perf_counter()
        result = generate_daily_plan(catalog, request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert result is not None
        assert elapsed_ms < 50

    def test_match_meals_200_under_20ms(self) -> None:
        catalog = generate_large_catalog(200)
        request = MealMatchRequest(
            targets=maintenance_targets,
            allergies=[],
            dietary_preferences=[],
            limit=10,
        )

        start = time.perf_counter()
        result = match_meals(catalog, request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert len(result) == 10
        assert elapsed_ms < 20
