"""Common enums and base schemas."""

from enum import StrEnum


class Allergen(StrEnum):
    DAIRY = "dairy"
    EGGS = "eggs"
    FISH = "fish"
    SHELLFISH = "shellfish"
    TREE_NUTS = "tree_nuts"
    PEANUTS = "peanuts"
    WHEAT = "wheat"
    SOY = "soy"
    SESAME = "sesame"
    GLUTEN = "gluten"


class DietaryTag(StrEnum):
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    KETO = "keto"
    HIGH_PROTEIN = "high_protein"
    LOW_CARB = "low_carb"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"


class MealCategory(StrEnum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class FitnessGoal(StrEnum):
    MAINTENANCE = "maintenance"
    CUTTING = "cutting"
    BULKING = "bulking"
    KETO = "keto"


class OrderStatus(StrEnum):
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERING = "delivering"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderType(StrEnum):
    ONE_TIME = "one_time"
    SUBSCRIPTION = "subscription"


class SubscriptionStatus(StrEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
