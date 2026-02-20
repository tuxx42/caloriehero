"""Seed script: 20 meals + 3 delivery zones + 63 delivery slots."""

import asyncio
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models import Base, DeliverySlot, DeliveryZone, Meal

SEED_MEALS = [
    {
        "name": "Grilled Chicken Breast",
        "description": "Herb-marinated chicken breast grilled to perfection, served with steamed broccoli and brown rice.",
        "category": "lunch",
        "calories": 420, "protein": 48, "carbs": 32, "fat": 10, "fiber": 4, "sugar": 2,
        "serving_size": "350g", "price": 180,
        "allergens": [], "dietary_tags": ["high_protein", "gluten_free"],
    },
    {
        "name": "Salmon Poke Bowl",
        "description": "Fresh Atlantic salmon over sushi rice with edamame, avocado, cucumber, and sesame dressing.",
        "category": "lunch",
        "calories": 520, "protein": 35, "carbs": 52, "fat": 18, "fiber": 5, "sugar": 6,
        "serving_size": "400g", "price": 250,
        "allergens": ["fish", "soy", "sesame"], "dietary_tags": ["high_protein", "dairy_free"],
    },
    {
        "name": "Greek Yogurt Parfait",
        "description": "Creamy Greek yogurt layered with granola, mixed berries, and a drizzle of honey.",
        "category": "breakfast",
        "calories": 320, "protein": 22, "carbs": 42, "fat": 8, "fiber": 3, "sugar": 18,
        "serving_size": "280g", "price": 120,
        "allergens": ["dairy"], "dietary_tags": ["vegetarian"],
    },
    {
        "name": "Turkey & Avocado Wrap",
        "description": "Sliced turkey, avocado, mixed greens, and chipotle mayo in a whole wheat tortilla.",
        "category": "lunch",
        "calories": 450, "protein": 32, "carbs": 38, "fat": 18, "fiber": 6, "sugar": 3,
        "serving_size": "320g", "price": 160,
        "allergens": ["wheat", "eggs"], "dietary_tags": ["high_protein"],
    },
    {
        "name": "Beef Stir-Fry",
        "description": "Tender beef strips with bell peppers, snap peas, and broccoli in garlic ginger sauce, served over jasmine rice.",
        "category": "dinner",
        "calories": 580, "protein": 42, "carbs": 55, "fat": 18, "fiber": 4, "sugar": 8,
        "serving_size": "420g", "price": 220,
        "allergens": ["soy"], "dietary_tags": ["high_protein", "dairy_free"],
    },
    {
        "name": "Veggie Buddha Bowl",
        "description": "Quinoa base with roasted sweet potato, chickpeas, kale, tahini dressing, and pickled onions.",
        "category": "lunch",
        "calories": 480, "protein": 18, "carbs": 62, "fat": 16, "fiber": 12, "sugar": 8,
        "serving_size": "380g", "price": 170,
        "allergens": ["sesame"], "dietary_tags": ["vegan", "gluten_free", "dairy_free"],
    },
    {
        "name": "Egg White Omelette",
        "description": "Fluffy egg white omelette with spinach, mushrooms, and feta cheese, served with whole grain toast.",
        "category": "breakfast",
        "calories": 280, "protein": 28, "carbs": 22, "fat": 8, "fiber": 3, "sugar": 2,
        "serving_size": "250g", "price": 130,
        "allergens": ["eggs", "dairy", "wheat"], "dietary_tags": ["vegetarian", "high_protein"],
    },
    {
        "name": "Teriyaki Salmon",
        "description": "Glazed Atlantic salmon fillet with steamed jasmine rice and stir-fried vegetables.",
        "category": "dinner",
        "calories": 550, "protein": 40, "carbs": 48, "fat": 20, "fiber": 3, "sugar": 10,
        "serving_size": "380g", "price": 280,
        "allergens": ["fish", "soy"], "dietary_tags": ["high_protein", "dairy_free"],
    },
    {
        "name": "Overnight Oats",
        "description": "Rolled oats soaked in almond milk with chia seeds, banana, peanut butter, and dark chocolate chips.",
        "category": "breakfast",
        "calories": 380, "protein": 14, "carbs": 52, "fat": 14, "fiber": 8, "sugar": 16,
        "serving_size": "300g", "price": 110,
        "allergens": ["peanuts"], "dietary_tags": ["vegan", "dairy_free"],
    },
    {
        "name": "Chicken Caesar Salad",
        "description": "Grilled chicken breast over romaine lettuce with parmesan, croutons, and classic Caesar dressing.",
        "category": "lunch",
        "calories": 380, "protein": 38, "carbs": 18, "fat": 16, "fiber": 3, "sugar": 2,
        "serving_size": "320g", "price": 170,
        "allergens": ["dairy", "eggs", "wheat", "fish"], "dietary_tags": ["high_protein"],
    },
    {
        "name": "Shrimp Pad Thai",
        "description": "Rice noodles with shrimp, bean sprouts, scrambled egg, peanuts, and tamarind sauce.",
        "category": "dinner",
        "calories": 520, "protein": 28, "carbs": 62, "fat": 16, "fiber": 3, "sugar": 12,
        "serving_size": "380g", "price": 200,
        "allergens": ["shellfish", "peanuts", "eggs", "soy"], "dietary_tags": ["dairy_free"],
    },
    {
        "name": "Protein Smoothie Bowl",
        "description": "Blended acai, banana, and protein powder topped with granola, coconut, and fresh berries.",
        "category": "breakfast",
        "calories": 350, "protein": 26, "carbs": 48, "fat": 8, "fiber": 6, "sugar": 22,
        "serving_size": "320g", "price": 150,
        "allergens": ["tree_nuts"], "dietary_tags": ["vegetarian", "high_protein", "dairy_free"],
    },
    {
        "name": "Lamb Kofta Plate",
        "description": "Spiced lamb kofta with hummus, tabbouleh, warm pita bread, and tzatziki sauce.",
        "category": "dinner",
        "calories": 620, "protein": 38, "carbs": 45, "fat": 28, "fiber": 5, "sugar": 4,
        "serving_size": "420g", "price": 260,
        "allergens": ["dairy", "wheat", "sesame"], "dietary_tags": ["high_protein"],
    },
    {
        "name": "Tofu Stir-Fry",
        "description": "Crispy tofu with mixed vegetables in sweet chili sauce, served over brown rice.",
        "category": "dinner",
        "calories": 420, "protein": 22, "carbs": 52, "fat": 14, "fiber": 6, "sugar": 10,
        "serving_size": "380g", "price": 160,
        "allergens": ["soy"], "dietary_tags": ["vegan", "dairy_free"],
    },
    {
        "name": "Avocado Toast with Eggs",
        "description": "Sourdough toast with smashed avocado, poached eggs, cherry tomatoes, and everything seasoning.",
        "category": "breakfast",
        "calories": 380, "protein": 18, "carbs": 32, "fat": 22, "fiber": 7, "sugar": 3,
        "serving_size": "280g", "price": 140,
        "allergens": ["eggs", "wheat"], "dietary_tags": ["vegetarian"],
    },
    {
        "name": "Chicken Tikka Masala",
        "description": "Tender chicken in creamy tomato tikka sauce with basmati rice and garlic naan.",
        "category": "dinner",
        "calories": 650, "protein": 42, "carbs": 60, "fat": 24, "fiber": 4, "sugar": 8,
        "serving_size": "450g", "price": 230,
        "allergens": ["dairy", "wheat"], "dietary_tags": ["high_protein"],
    },
    {
        "name": "Mixed Nuts & Fruit",
        "description": "Premium mix of almonds, cashews, dried cranberries, and dark chocolate pieces.",
        "category": "snack",
        "calories": 220, "protein": 6, "carbs": 20, "fat": 14, "fiber": 3, "sugar": 12,
        "serving_size": "60g", "price": 80,
        "allergens": ["tree_nuts"], "dietary_tags": ["vegan", "gluten_free", "dairy_free"],
    },
    {
        "name": "Protein Bar",
        "description": "Whey protein bar with peanut butter, oats, and dark chocolate coating.",
        "category": "snack",
        "calories": 250, "protein": 20, "carbs": 28, "fat": 8, "fiber": 3, "sugar": 10,
        "serving_size": "65g", "price": 70,
        "allergens": ["dairy", "peanuts", "wheat"], "dietary_tags": ["high_protein"],
    },
    {
        "name": "Grilled Fish Tacos",
        "description": "Blackened white fish in corn tortillas with mango salsa, cabbage slaw, and lime crema.",
        "category": "lunch",
        "calories": 440, "protein": 32, "carbs": 42, "fat": 16, "fiber": 5, "sugar": 8,
        "serving_size": "340g", "price": 190,
        "allergens": ["fish", "dairy"], "dietary_tags": ["high_protein"],
    },
    {
        "name": "Keto Chicken Thighs",
        "description": "Crispy skin chicken thighs with cauliflower mash, roasted asparagus, and herb butter.",
        "category": "dinner",
        "calories": 520, "protein": 42, "carbs": 8, "fat": 36, "fiber": 4, "sugar": 3,
        "serving_size": "380g", "price": 210,
        "allergens": ["dairy"], "dietary_tags": ["keto", "low_carb", "high_protein", "gluten_free"],
    },
]

SEED_ZONES = [
    {"name": "City Center", "lat": 13.7563, "lng": 100.5018, "radius_km": 5, "delivery_fee": 0},
    {"name": "Sukhumvit", "lat": 13.7310, "lng": 100.5673, "radius_km": 8, "delivery_fee": 30},
    {"name": "Silom", "lat": 13.7262, "lng": 100.5234, "radius_km": 6, "delivery_fee": 20},
]


async def seed() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # Seed meals
        print(f"Inserting {len(SEED_MEALS)} meals...")
        for meal_data in SEED_MEALS:
            session.add(Meal(**meal_data))
        await session.flush()
        print("Meals inserted.")

        # Seed delivery zones
        print(f"Inserting {len(SEED_ZONES)} delivery zones...")
        zones = []
        for zone_data in SEED_ZONES:
            zone = DeliveryZone(**zone_data)
            session.add(zone)
            zones.append(zone)
        await session.flush()
        print("Delivery zones inserted.")

        # Seed delivery slots (next 7 days, 3 slots per zone per day)
        today = datetime.now()
        slots = []
        for zone in zones:
            for d in range(7):
                date = today + timedelta(days=d)
                date_str = date.strftime("%Y-%m-%d")
                slots.extend([
                    DeliverySlot(
                        date=date_str, start_time="09:00", end_time="12:00",
                        zone_id=zone.id, capacity=20, booked_count=0,
                    ),
                    DeliverySlot(
                        date=date_str, start_time="12:00", end_time="15:00",
                        zone_id=zone.id, capacity=30, booked_count=0,
                    ),
                    DeliverySlot(
                        date=date_str, start_time="17:00", end_time="20:00",
                        zone_id=zone.id, capacity=25, booked_count=0,
                    ),
                ])
        print(f"Inserting {len(slots)} delivery slots...")
        session.add_all(slots)
        await session.commit()
        print("Delivery slots inserted.")

    await engine.dispose()
    print("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
