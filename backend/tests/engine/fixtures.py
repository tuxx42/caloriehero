"""Test fixtures for the meal plan engine — mirrors the TypeScript fixtures."""

from app.engine.types import MacroTargets, Meal, NutritionalInfo


def make_meal(
    id: str,
    name: str,
    category: str,
    nutritional_info: NutritionalInfo,
    allergens: list[str] | None = None,
    dietary_tags: list[str] | None = None,
) -> Meal:
    return Meal(
        id=id,
        name=name,
        description=f"{name} - healthy Thai meal",
        category=category,  # type: ignore[arg-type]
        nutritional_info=nutritional_info,
        serving_size="350g",
        price=120,
        allergens=allergens or [],
        dietary_tags=dietary_tags or [],
        active=True,
    )


# --- Breakfast meals (8) ---

breakfast_meals: list[Meal] = [
    make_meal(
        "b1000000-0000-0000-0000-000000000001",
        "Khao Tom Moo (Rice Soup with Pork)",
        "breakfast",
        NutritionalInfo(calories=320, protein=18, carbs=45, fat=8),
        allergens=["soy"],
        dietary_tags=["halal"],
    ),
    make_meal(
        "b2000000-0000-0000-0000-000000000002",
        "Thai Omelette with Brown Rice",
        "breakfast",
        NutritionalInfo(calories=380, protein=22, carbs=40, fat=14),
        allergens=["eggs"],
        dietary_tags=["gluten_free", "halal"],
    ),
    make_meal(
        "b3000000-0000-0000-0000-000000000003",
        "Protein Smoothie Bowl",
        "breakfast",
        NutritionalInfo(calories=420, protein=35, carbs=38, fat=10),
        allergens=["dairy"],
        dietary_tags=["vegetarian", "high_protein", "gluten_free"],
    ),
    make_meal(
        "b4000000-0000-0000-0000-000000000004",
        "Avocado Toast with Eggs",
        "breakfast",
        NutritionalInfo(calories=450, protein=20, carbs=35, fat=22),
        allergens=["eggs", "wheat"],
        dietary_tags=["vegetarian"],
    ),
    make_meal(
        "b5000000-0000-0000-0000-000000000005",
        "Mango Sticky Rice (Low Sugar)",
        "breakfast",
        NutritionalInfo(calories=350, protein=8, carbs=68, fat=6),
        allergens=[],
        dietary_tags=["vegetarian", "vegan", "gluten_free"],
    ),
    make_meal(
        "b6000000-0000-0000-0000-000000000006",
        "Keto Egg Salad",
        "breakfast",
        NutritionalInfo(calories=290, protein=18, carbs=4, fat=22),
        allergens=["eggs"],
        dietary_tags=["keto", "low_carb", "gluten_free"],
    ),
    make_meal(
        "b7000000-0000-0000-0000-000000000007",
        "Greek Yogurt with Granola",
        "breakfast",
        NutritionalInfo(calories=310, protein=16, carbs=42, fat=7),
        allergens=["dairy", "wheat"],
        dietary_tags=["vegetarian", "high_protein"],
    ),
    make_meal(
        "b8000000-0000-0000-0000-000000000008",
        "Tofu Scramble with Vegetables",
        "breakfast",
        NutritionalInfo(calories=280, protein=20, carbs=18, fat=12),
        allergens=["soy"],
        dietary_tags=["vegetarian", "vegan", "gluten_free", "dairy_free"],
    ),
]

# --- Lunch meals (10) ---

lunch_meals: list[Meal] = [
    make_meal(
        "l1000000-0000-0000-0000-000000000001",
        "Pad Thai Gai (Chicken Pad Thai)",
        "lunch",
        NutritionalInfo(calories=520, protein=32, carbs=58, fat=16),
        allergens=["peanuts", "soy", "fish", "eggs"],
        dietary_tags=["halal"],
    ),
    make_meal(
        "l2000000-0000-0000-0000-000000000002",
        "Grilled Chicken Salad",
        "lunch",
        NutritionalInfo(calories=380, protein=40, carbs=18, fat=14),
        allergens=[],
        dietary_tags=["gluten_free", "halal", "high_protein", "dairy_free"],
    ),
    make_meal(
        "l3000000-0000-0000-0000-000000000003",
        "Tom Yum Soup with Tofu",
        "lunch",
        NutritionalInfo(calories=250, protein=18, carbs=20, fat=8),
        allergens=["soy"],
        dietary_tags=["vegetarian", "vegan", "gluten_free", "dairy_free"],
    ),
    make_meal(
        "l4000000-0000-0000-0000-000000000004",
        "Som Tum with Grilled Pork",
        "lunch",
        NutritionalInfo(calories=420, protein=35, carbs=25, fat=18),
        allergens=["peanuts", "fish"],
        dietary_tags=["gluten_free", "halal"],
    ),
    make_meal(
        "l5000000-0000-0000-0000-000000000005",
        "Brown Rice Beef Bowl",
        "lunch",
        NutritionalInfo(calories=580, protein=38, carbs=65, fat=15),
        allergens=["soy"],
        dietary_tags=["high_protein", "halal"],
    ),
    make_meal(
        "l6000000-0000-0000-0000-000000000006",
        "Keto Larb Moo (Pork Salad)",
        "lunch",
        NutritionalInfo(calories=330, protein=28, carbs=6, fat=22),
        allergens=["fish"],
        dietary_tags=["keto", "low_carb", "gluten_free"],
    ),
    make_meal(
        "l7000000-0000-0000-0000-000000000007",
        "Vegetarian Green Curry with Rice",
        "lunch",
        NutritionalInfo(calories=490, protein=14, carbs=72, fat=16),
        allergens=["dairy"],
        dietary_tags=["vegetarian", "gluten_free"],
    ),
    make_meal(
        "l8000000-0000-0000-0000-000000000008",
        "Salmon with Quinoa",
        "lunch",
        NutritionalInfo(calories=520, protein=42, carbs=38, fat=18),
        allergens=["fish"],
        dietary_tags=["gluten_free", "high_protein", "dairy_free"],
    ),
    make_meal(
        "l9000000-0000-0000-0000-000000000009",
        "Tofu Basil Stir Fry with Rice",
        "lunch",
        NutritionalInfo(calories=430, protein=20, carbs=56, fat=12),
        allergens=["soy"],
        dietary_tags=["vegetarian", "vegan", "dairy_free"],
    ),
    make_meal(
        "la000000-0000-0000-0000-000000000010",
        "High Protein Tuna Bowl",
        "lunch",
        NutritionalInfo(calories=440, protein=50, carbs=32, fat=10),
        allergens=["fish"],
        dietary_tags=["high_protein", "gluten_free", "dairy_free"],
    ),
]

# --- Dinner meals (8) ---

dinner_meals: list[Meal] = [
    make_meal(
        "d1000000-0000-0000-0000-000000000001",
        "Massaman Curry with Chicken",
        "dinner",
        NutritionalInfo(calories=620, protein=38, carbs=52, fat=26),
        allergens=["peanuts", "dairy"],
        dietary_tags=["halal", "gluten_free"],
    ),
    make_meal(
        "d2000000-0000-0000-0000-000000000002",
        "Grilled Sea Bass with Steamed Vegetables",
        "dinner",
        NutritionalInfo(calories=420, protein=45, carbs=18, fat=16),
        allergens=["fish"],
        dietary_tags=["gluten_free", "high_protein", "dairy_free"],
    ),
    make_meal(
        "d3000000-0000-0000-0000-000000000003",
        "Keto Roast Duck with Vegetables",
        "dinner",
        NutritionalInfo(calories=480, protein=40, carbs=8, fat=32),
        allergens=[],
        dietary_tags=["keto", "low_carb", "gluten_free", "dairy_free"],
    ),
    make_meal(
        "d4000000-0000-0000-0000-000000000004",
        "Vegan Thai Red Curry",
        "dinner",
        NutritionalInfo(calories=380, protein=12, carbs=58, fat=14),
        allergens=["soy"],
        dietary_tags=["vegetarian", "vegan", "gluten_free"],
    ),
    make_meal(
        "d5000000-0000-0000-0000-000000000005",
        "Beef Bulgogi Bowl",
        "dinner",
        NutritionalInfo(calories=560, protein=42, carbs=48, fat=20),
        allergens=["soy", "sesame"],
        dietary_tags=["high_protein", "dairy_free"],
    ),
    make_meal(
        "d6000000-0000-0000-0000-000000000006",
        "Chicken Tikka Masala with Brown Rice",
        "dinner",
        NutritionalInfo(calories=590, protein=44, carbs=55, fat=18),
        allergens=["dairy"],
        dietary_tags=["halal", "high_protein", "gluten_free"],
    ),
    make_meal(
        "d7000000-0000-0000-0000-000000000007",
        "Tempeh Stir Fry with Noodles",
        "dinner",
        NutritionalInfo(calories=440, protein=24, carbs=54, fat=14),
        allergens=["soy", "wheat"],
        dietary_tags=["vegetarian", "vegan", "dairy_free"],
    ),
    make_meal(
        "d8000000-0000-0000-0000-000000000008",
        "Lean Pork Tenderloin with Sweet Potato",
        "dinner",
        NutritionalInfo(calories=500, protein=40, carbs=45, fat=14),
        allergens=[],
        dietary_tags=["gluten_free", "dairy_free", "high_protein", "halal"],
    ),
]

# --- Snack meals (6) ---

snack_meals: list[Meal] = [
    make_meal(
        "s1000000-0000-0000-0000-000000000001",
        "Protein Bar (Whey)",
        "snack",
        NutritionalInfo(calories=220, protein=20, carbs=22, fat=6),
        allergens=["dairy", "soy"],
        dietary_tags=["high_protein", "gluten_free"],
    ),
    make_meal(
        "s2000000-0000-0000-0000-000000000002",
        "Mixed Nuts and Dried Fruit",
        "snack",
        NutritionalInfo(calories=260, protein=8, carbs=24, fat=16),
        allergens=["tree_nuts"],
        dietary_tags=["vegetarian", "vegan", "gluten_free", "dairy_free"],
    ),
    make_meal(
        "s3000000-0000-0000-0000-000000000003",
        "Keto Fat Bomb (Peanut Butter)",
        "snack",
        NutritionalInfo(calories=200, protein=6, carbs=4, fat=18),
        allergens=["peanuts"],
        dietary_tags=["keto", "low_carb", "vegetarian", "gluten_free", "dairy_free"],
    ),
    make_meal(
        "s4000000-0000-0000-0000-000000000004",
        "Greek Yogurt with Berries",
        "snack",
        NutritionalInfo(calories=180, protein=14, carbs=20, fat=4),
        allergens=["dairy"],
        dietary_tags=["vegetarian", "gluten_free", "high_protein"],
    ),
    make_meal(
        "s5000000-0000-0000-0000-000000000005",
        "Edamame",
        "snack",
        NutritionalInfo(calories=150, protein=12, carbs=14, fat=5),
        allergens=["soy"],
        dietary_tags=["vegetarian", "vegan", "gluten_free", "dairy_free"],
    ),
    make_meal(
        "s6000000-0000-0000-0000-000000000006",
        "Rice Crackers with Hummus",
        "snack",
        NutritionalInfo(calories=240, protein=7, carbs=36, fat=8),
        allergens=["sesame"],
        dietary_tags=["vegetarian", "vegan", "dairy_free"],
    ),
]

# --- Combined catalog ---

all_meals: list[Meal] = breakfast_meals + lunch_meals + dinner_meals + snack_meals

# --- User macro profiles ---

maintenance_targets = MacroTargets(calories=2000, protein=150, carbs=200, fat=65)
bulking_targets = MacroTargets(calories=2800, protein=200, carbs=320, fat=85)
cutting_targets = MacroTargets(calories=1500, protein=160, carbs=120, fat=45)
keto_targets = MacroTargets(calories=1800, protein=130, carbs=30, fat=140)


def generate_large_catalog(count: int) -> list[Meal]:
    """Generate a large catalog by repeating meals with unique IDs and slight macro variations."""
    base = all_meals
    result: list[Meal] = []

    for i in range(count):
        template = base[i % len(base)]
        new_id = template.id[:28] + str(i).zfill(8)
        ni = template.nutritional_info
        result.append(
            Meal(
                id=new_id,
                name=f"{template.name} #{i}",
                description=template.description,
                category=template.category,
                nutritional_info=NutritionalInfo(
                    calories=max(100, ni.calories + (i % 50) - 25),
                    protein=max(1, ni.protein + (i % 10) - 5),
                    carbs=max(0, ni.carbs + (i % 10) - 5),
                    fat=max(1, ni.fat + (i % 6) - 3),
                ),
                serving_size=template.serving_size,
                price=template.price,
                allergens=template.allergens,
                dietary_tags=template.dietary_tags,
                active=template.active,
            )
        )

    return result
