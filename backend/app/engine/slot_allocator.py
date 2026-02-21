"""Distribute daily macro targets across meal slots."""

from app.engine.types import MacroTargets, SlotAllocation

PERCENTAGE_SUM_TOLERANCE = 0.01


def allocate_slots(
    daily_targets: MacroTargets,
    slots: list[dict[str, object]],
) -> list[SlotAllocation]:
    """Distribute daily macro targets across meal slots proportionally.

    Validates that percentages sum to ~1.0 (within 0.01 tolerance).
    Applies rounding correction to ensure allocated macros sum exactly to daily targets.

    Raises:
        ValueError: If no slots provided or percentages don't sum to ~1.0.
    """
    if not slots:
        raise ValueError("At least one slot must be provided")

    total_percentage = sum(float(s["percentage"]) for s in slots)  # type: ignore[arg-type]
    if abs(total_percentage - 1.0) > PERCENTAGE_SUM_TOLERANCE:
        raise ValueError(
            f"Slot percentages must sum to 1.0 (got {total_percentage:.4f})"
        )

    # Calculate raw allocations with rounding
    rounded: list[SlotAllocation] = []
    for s in slots:
        slot = str(s["slot"])
        pct = float(s["percentage"])  # type: ignore[arg-type]
        targets = MacroTargets(
            calories=round(daily_targets.calories * pct, 2),
            protein=round(daily_targets.protein * pct, 2),
            carbs=round(daily_targets.carbs * pct, 2),
            fat=round(daily_targets.fat * pct, 2),
        )
        rounded.append(SlotAllocation(slot=slot, percentage=pct, targets=targets))  # type: ignore[arg-type]

    # Fix rounding errors by adjusting the last slot
    if len(rounded) > 1:
        sum_calories = sum(a.targets.calories for a in rounded[:-1])
        sum_protein = sum(a.targets.protein for a in rounded[:-1])
        sum_carbs = sum(a.targets.carbs for a in rounded[:-1])
        sum_fat = sum(a.targets.fat for a in rounded[:-1])

        last = rounded[-1]
        corrected_targets = MacroTargets(
            calories=round(daily_targets.calories - sum_calories, 2),
            protein=round(daily_targets.protein - sum_protein, 2),
            carbs=round(daily_targets.carbs - sum_carbs, 2),
            fat=round(daily_targets.fat - sum_fat, 2),
        )
        rounded[-1] = SlotAllocation(
            slot=last.slot, percentage=last.percentage, targets=corrected_targets
        )

    return rounded
