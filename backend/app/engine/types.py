"""Type definitions for the meal plan engine. Zero external dependencies."""

from dataclasses import dataclass, field
from typing import Literal

MealCategory = Literal["breakfast", "lunch", "dinner", "snack"]
MealSlot = Literal["breakfast", "lunch", "dinner", "snack"]
Allergen = Literal[
    "dairy", "eggs", "fish", "shellfish", "tree_nuts", "peanuts", "wheat", "soy", "sesame"
]
DietaryTag = Literal[
    "vegetarian", "vegan", "gluten_free", "keto", "low_carb", "high_protein", "dairy_free", "halal"
]


@dataclass(frozen=True)
class MacroTargets:
    calories: float
    protein: float
    carbs: float
    fat: float


@dataclass(frozen=True)
class NutritionalInfo:
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float | None = None
    sugar: float | None = None


@dataclass(frozen=True)
class Meal:
    id: str
    name: str
    description: str
    category: MealCategory
    nutritional_info: NutritionalInfo
    serving_size: str
    price: float
    allergens: list[str] = field(default_factory=list)
    dietary_tags: list[str] = field(default_factory=list)
    active: bool = True
    image_url: str | None = None
    poster_product_id: str | None = None


@dataclass(frozen=True)
class ScoringWeights:
    calories: float = 0.4
    protein: float = 0.3
    carbs: float = 0.15
    fat: float = 0.15


@dataclass(frozen=True)
class Tolerance:
    calories: float = 0.1
    protein: float = 0.15
    carbs: float = 0.15
    fat: float = 0.15


@dataclass(frozen=True)
class MacroDeviation:
    calories: float
    protein: float
    carbs: float
    fat: float


@dataclass(frozen=True)
class ScoredMeal:
    meal: Meal
    score: float
    deviation: MacroDeviation


@dataclass(frozen=True)
class SlotAllocation:
    slot: MealSlot
    percentage: float
    targets: MacroTargets


@dataclass(frozen=True)
class PlanItem:
    slot: MealSlot
    meal: Meal
    score: float
    slot_targets: MacroTargets


@dataclass(frozen=True)
class OptimalPlanItem:
    slot: MealSlot
    meal: Meal
    score: float


@dataclass(frozen=True)
class OptimalPlan:
    items: list[OptimalPlanItem]
    total_score: float


@dataclass(frozen=True)
class MealMatchRequest:
    targets: MacroTargets
    allergies: list[str] = field(default_factory=list)
    dietary_preferences: list[str] = field(default_factory=list)
    category: MealCategory | None = None
    limit: int = 10
    weights: ScoringWeights | None = None


@dataclass(frozen=True)
class PlanRequest:
    daily_targets: MacroTargets
    slots: list[dict[str, object]]  # [{"slot": MealSlot, "percentage": float}]
    allergies: list[str] = field(default_factory=list)
    dietary_preferences: list[str] = field(default_factory=list)
    weights: ScoringWeights | None = None


@dataclass(frozen=True)
class PlanResult:
    items: list[PlanItem]
    total_score: float
    actual_macros: NutritionalInfo
    target_macros: MacroTargets
