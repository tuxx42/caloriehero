"""Tests for scoring module — ported from TypeScript."""

import pytest

from app.engine.scoring import calculate_deviation, calculate_score
from app.engine.types import MacroTargets, NutritionalInfo, ScoringWeights


class TestCalculateDeviation:
    def test_returns_zero_deviation_for_perfect_match(self) -> None:
        ni = NutritionalInfo(calories=500, protein=40, carbs=50, fat=15)
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=15)
        dev = calculate_deviation(ni, target)
        assert dev.calories == 0
        assert dev.protein == 0
        assert dev.carbs == 0
        assert dev.fat == 0

    def test_returns_absolute_deviation(self) -> None:
        ni = NutritionalInfo(calories=400, protein=30, carbs=40, fat=10)
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=15)
        dev = calculate_deviation(ni, target)
        assert dev.calories == 100
        assert dev.protein == 10
        assert dev.carbs == 10
        assert dev.fat == 5

    def test_handles_actual_greater_than_target(self) -> None:
        ni = NutritionalInfo(calories=600, protein=50, carbs=60, fat=20)
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=15)
        dev = calculate_deviation(ni, target)
        assert dev.calories == 100
        assert dev.protein == 10
        assert dev.carbs == 10
        assert dev.fat == 5


class TestCalculateScore:
    def test_returns_1_for_perfect_match(self) -> None:
        ni = NutritionalInfo(calories=500, protein=40, carbs=50, fat=15)
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=15)
        assert calculate_score(ni, target) == 1.0

    def test_returns_0_when_all_macros_100_percent_off(self) -> None:
        ni = NutritionalInfo(calories=1000, protein=80, carbs=100, fat=30)
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=15)
        assert calculate_score(ni, target) == 0.0

    def test_returns_value_in_0_1_range(self) -> None:
        ni = NutritionalInfo(calories=300, protein=20, carbs=80, fat=5)
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=15)
        score = calculate_score(ni, target)
        assert 0 <= score <= 1

    def test_proportional_degradation(self) -> None:
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=20)
        perfect = NutritionalInfo(calories=500, protein=40, carbs=50, fat=20)
        off_by_half = NutritionalInfo(calories=750, protein=40, carbs=50, fat=20)

        perf_score = calculate_score(perfect, target)
        half_score = calculate_score(off_by_half, target)

        assert perf_score == 1.0
        assert half_score < perf_score
        assert half_score == pytest.approx(0.8, abs=1e-5)

    def test_scoring_weights_affect_final_score(self) -> None:
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=20)
        ni = NutritionalInfo(calories=250, protein=40, carbs=50, fat=20)

        default_score = calculate_score(ni, target)
        heavy = ScoringWeights(calories=0.9, protein=0.1, carbs=0.0, fat=0.0)
        heavy_score = calculate_score(ni, target, heavy)
        light = ScoringWeights(calories=0.1, protein=0.9, carbs=0.0, fat=0.0)
        light_score = calculate_score(ni, target, light)

        assert heavy_score < default_score
        assert light_score > default_score

    def test_zero_target_zero_actual_scores_1(self) -> None:
        ni = NutritionalInfo(calories=500, protein=0, carbs=50, fat=0)
        target = MacroTargets(calories=500, protein=0, carbs=50, fat=0)
        assert calculate_score(ni, target) == 1.0

    def test_zero_target_nonzero_actual_scores_0_for_that_macro(self) -> None:
        target = MacroTargets(calories=500, protein=0, carbs=50, fat=0)
        ni = NutritionalInfo(calories=500, protein=40, carbs=50, fat=0)
        score = calculate_score(ni, target)
        assert score == pytest.approx(0.7, abs=1e-5)

    def test_all_zero_near_zero_match(self) -> None:
        target = MacroTargets(calories=1, protein=0, carbs=0, fat=0)
        ni = NutritionalInfo(calories=1, protein=0, carbs=0, fat=0)
        assert calculate_score(ni, target) == 1.0

    def test_score_degrades_smoothly(self) -> None:
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=20)
        ni10 = NutritionalInfo(calories=550, protein=40, carbs=50, fat=20)
        ni50 = NutritionalInfo(calories=750, protein=40, carbs=50, fat=20)
        ni100 = NutritionalInfo(calories=1000, protein=40, carbs=50, fat=20)
        score10 = calculate_score(ni10, target)
        score50 = calculate_score(ni50, target)
        score100 = calculate_score(ni100, target)
        assert score10 > score50 > score100

    def test_symmetric_scoring(self) -> None:
        target = MacroTargets(calories=500, protein=40, carbs=50, fat=20)
        above = NutritionalInfo(calories=600, protein=40, carbs=50, fat=20)
        below = NutritionalInfo(calories=400, protein=40, carbs=50, fat=20)
        score_above = calculate_score(above, target)
        score_below = calculate_score(below, target)
        assert score_above == pytest.approx(score_below, abs=1e-10)
