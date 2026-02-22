"""Seed script: 20 meals + 3 delivery zones + 63 delivery slots."""

import asyncio
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models import Base, AppSettings, DeliverySlot, DeliveryZone, Meal

SEED_MEALS = [
    {
        "name": "Grilled Chicken Breast",
        "description": "Herb-marinated chicken breast grilled to perfection, served with steamed broccoli and brown rice.",
        "category": "lunch",
        "calories": 420, "protein": 48, "carbs": 32, "fat": 10, "fiber": 4, "sugar": 2,
        "serving_size": "350g", "price": 180,
        "allergens": [], "dietary_tags": ["high_protein", "gluten_free"],
        "image_url": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600",
        "nutritional_benefits": "Excellent source of lean protein for muscle repair and growth. Broccoli provides vitamin C and sulforaphane, a powerful antioxidant. Brown rice offers sustained energy through complex carbohydrates.",
    },
    {
        "name": "Salmon Poke Bowl",
        "description": "Fresh Atlantic salmon over sushi rice with edamame, avocado, cucumber, and sesame dressing.",
        "category": "lunch",
        "calories": 520, "protein": 35, "carbs": 52, "fat": 18, "fiber": 5, "sugar": 6,
        "serving_size": "400g", "price": 250,
        "allergens": ["fish", "soy", "sesame"], "dietary_tags": ["high_protein", "dairy_free"],
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
        "nutritional_benefits": "Rich in omega-3 fatty acids from salmon, supporting heart and brain health. Edamame adds plant-based protein and fiber. Avocado provides healthy monounsaturated fats and potassium.",
    },
    {
        "name": "Greek Yogurt Parfait",
        "description": "Creamy Greek yogurt layered with granola, mixed berries, and a drizzle of honey.",
        "category": "breakfast",
        "calories": 320, "protein": 22, "carbs": 42, "fat": 8, "fiber": 3, "sugar": 18,
        "serving_size": "280g", "price": 120,
        "allergens": ["dairy"], "dietary_tags": ["vegetarian"],
        "image_url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600",
        "nutritional_benefits": "Greek yogurt is packed with probiotics for gut health and calcium for strong bones. Mixed berries deliver antioxidants and vitamin C. A balanced breakfast that supports sustained morning energy.",
    },
    {
        "name": "Turkey & Avocado Wrap",
        "description": "Sliced turkey, avocado, mixed greens, and chipotle mayo in a whole wheat tortilla.",
        "category": "lunch",
        "calories": 450, "protein": 32, "carbs": 38, "fat": 18, "fiber": 6, "sugar": 3,
        "serving_size": "320g", "price": 160,
        "allergens": ["wheat", "eggs"], "dietary_tags": ["high_protein"],
        "image_url": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600",
        "nutritional_benefits": "Turkey is a lean protein source rich in B vitamins and selenium. Avocado adds heart-healthy fats and fiber. Whole wheat tortilla provides complex carbs for lasting energy.",
    },
    {
        "name": "Beef Stir-Fry",
        "description": "Tender beef strips with bell peppers, snap peas, and broccoli in garlic ginger sauce, served over jasmine rice.",
        "category": "dinner",
        "calories": 580, "protein": 42, "carbs": 55, "fat": 18, "fiber": 4, "sugar": 8,
        "serving_size": "420g", "price": 220,
        "allergens": ["soy"], "dietary_tags": ["high_protein", "dairy_free"],
        "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
        "nutritional_benefits": "Beef is an excellent source of iron, zinc, and B12 for energy metabolism. Bell peppers provide more vitamin C than oranges. Ginger has anti-inflammatory properties that aid digestion.",
    },
    {
        "name": "Veggie Buddha Bowl",
        "description": "Quinoa base with roasted sweet potato, chickpeas, kale, tahini dressing, and pickled onions.",
        "category": "lunch",
        "calories": 480, "protein": 18, "carbs": 62, "fat": 16, "fiber": 12, "sugar": 8,
        "serving_size": "380g", "price": 170,
        "allergens": ["sesame"], "dietary_tags": ["vegan", "gluten_free", "dairy_free"],
        "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
        "nutritional_benefits": "Quinoa is a complete plant protein with all nine essential amino acids. Sweet potato delivers beta-carotene and vitamin A. High fiber content from chickpeas and kale supports digestive health.",
    },
    {
        "name": "Egg White Omelette",
        "description": "Fluffy egg white omelette with spinach, mushrooms, and feta cheese, served with whole grain toast.",
        "category": "breakfast",
        "calories": 280, "protein": 28, "carbs": 22, "fat": 8, "fiber": 3, "sugar": 2,
        "serving_size": "250g", "price": 130,
        "allergens": ["eggs", "dairy", "wheat"], "dietary_tags": ["vegetarian", "high_protein"],
        "image_url": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600",
        "nutritional_benefits": "Egg whites provide pure protein with minimal fat and cholesterol. Spinach is rich in iron and folate. Mushrooms offer B vitamins and selenium for immune support.",
    },
    {
        "name": "Teriyaki Salmon",
        "description": "Glazed Atlantic salmon fillet with steamed jasmine rice and stir-fried vegetables.",
        "category": "dinner",
        "calories": 550, "protein": 40, "carbs": 48, "fat": 20, "fiber": 3, "sugar": 10,
        "serving_size": "380g", "price": 280,
        "allergens": ["fish", "soy"], "dietary_tags": ["high_protein", "dairy_free"],
        "image_url": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",
        "nutritional_benefits": "Salmon provides omega-3 DHA and EPA essential for brain function and reducing inflammation. High-quality protein supports muscle maintenance. Paired vegetables add micronutrients and antioxidants.",
    },
    {
        "name": "Overnight Oats",
        "description": "Rolled oats soaked in almond milk with chia seeds, banana, peanut butter, and dark chocolate chips.",
        "category": "breakfast",
        "calories": 380, "protein": 14, "carbs": 52, "fat": 14, "fiber": 8, "sugar": 16,
        "serving_size": "300g", "price": 110,
        "allergens": ["peanuts"], "dietary_tags": ["vegan", "dairy_free"],
        "image_url": "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600",
        "nutritional_benefits": "Oats are rich in beta-glucan fiber that helps lower cholesterol levels. Chia seeds provide omega-3s and keep you feeling full longer. Peanut butter adds healthy fats and plant protein.",
    },
    {
        "name": "Chicken Caesar Salad",
        "description": "Grilled chicken breast over romaine lettuce with parmesan, croutons, and classic Caesar dressing.",
        "category": "lunch",
        "calories": 380, "protein": 38, "carbs": 18, "fat": 16, "fiber": 3, "sugar": 2,
        "serving_size": "320g", "price": 170,
        "allergens": ["dairy", "eggs", "wheat", "fish"], "dietary_tags": ["high_protein"],
        "image_url": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600",
        "nutritional_benefits": "High protein-to-calorie ratio ideal for weight management. Romaine lettuce provides folate and vitamin K. A satisfying low-carb option that keeps blood sugar stable.",
    },
    {
        "name": "Shrimp Pad Thai",
        "description": "Rice noodles with shrimp, bean sprouts, scrambled egg, peanuts, and tamarind sauce.",
        "category": "dinner",
        "calories": 520, "protein": 28, "carbs": 62, "fat": 16, "fiber": 3, "sugar": 12,
        "serving_size": "380g", "price": 200,
        "allergens": ["shellfish", "peanuts", "eggs", "soy"], "dietary_tags": ["dairy_free"],
        "image_url": "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600",
        "nutritional_benefits": "Shrimp is low in calories but high in protein and iodine for thyroid health. Bean sprouts add crunch with minimal calories. Rice noodles are naturally gluten-free and easy to digest.",
    },
    {
        "name": "Protein Smoothie Bowl",
        "description": "Blended acai, banana, and protein powder topped with granola, coconut, and fresh berries.",
        "category": "breakfast",
        "calories": 350, "protein": 26, "carbs": 48, "fat": 8, "fiber": 6, "sugar": 22,
        "serving_size": "320g", "price": 150,
        "allergens": ["tree_nuts"], "dietary_tags": ["vegetarian", "high_protein", "dairy_free"],
        "image_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600",
        "nutritional_benefits": "Acai berries are one of the most antioxidant-rich fruits available. Protein powder supports post-workout recovery. Fresh berries provide vitamin C and natural sweetness without added sugar.",
    },
    {
        "name": "Lamb Kofta Plate",
        "description": "Spiced lamb kofta with hummus, tabbouleh, warm pita bread, and tzatziki sauce.",
        "category": "dinner",
        "calories": 620, "protein": 38, "carbs": 45, "fat": 28, "fiber": 5, "sugar": 4,
        "serving_size": "420g", "price": 260,
        "allergens": ["dairy", "wheat", "sesame"], "dietary_tags": ["high_protein"],
        "image_url": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600",
        "nutritional_benefits": "Lamb is rich in iron, zinc, and vitamin B12 essential for blood health. Hummus from chickpeas provides plant fiber and protein. Tabbouleh adds fresh parsley which is high in vitamin K.",
    },
    {
        "name": "Tofu Stir-Fry",
        "description": "Crispy tofu with mixed vegetables in sweet chili sauce, served over brown rice.",
        "category": "dinner",
        "calories": 420, "protein": 22, "carbs": 52, "fat": 14, "fiber": 6, "sugar": 10,
        "serving_size": "380g", "price": 160,
        "allergens": ["soy"], "dietary_tags": ["vegan", "dairy_free"],
        "image_url": "https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?w=600",
        "nutritional_benefits": "Tofu provides complete plant protein with isoflavones that support bone health. Brown rice adds magnesium and B vitamins. Mixed vegetables deliver a spectrum of vitamins and minerals.",
    },
    {
        "name": "Avocado Toast with Eggs",
        "description": "Sourdough toast with smashed avocado, poached eggs, cherry tomatoes, and everything seasoning.",
        "category": "breakfast",
        "calories": 380, "protein": 18, "carbs": 32, "fat": 22, "fiber": 7, "sugar": 3,
        "serving_size": "280g", "price": 140,
        "allergens": ["eggs", "wheat"], "dietary_tags": ["vegetarian"],
        "image_url": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600",
        "nutritional_benefits": "Avocado is loaded with heart-healthy monounsaturated fats and potassium. Eggs provide choline essential for brain health. Sourdough bread has a lower glycemic index than regular bread.",
    },
    {
        "name": "Chicken Tikka Masala",
        "description": "Tender chicken in creamy tomato tikka sauce with basmati rice and garlic naan.",
        "category": "dinner",
        "calories": 650, "protein": 42, "carbs": 60, "fat": 24, "fiber": 4, "sugar": 8,
        "serving_size": "450g", "price": 230,
        "allergens": ["dairy", "wheat"], "dietary_tags": ["high_protein"],
        "image_url": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600",
        "nutritional_benefits": "High protein content from chicken supports muscle building and satiety. Tomato-based sauce provides lycopene, a powerful antioxidant. Spices like turmeric and cumin have anti-inflammatory benefits.",
    },
    {
        "name": "Mixed Nuts & Fruit",
        "description": "Premium mix of almonds, cashews, dried cranberries, and dark chocolate pieces.",
        "category": "snack",
        "calories": 220, "protein": 6, "carbs": 20, "fat": 14, "fiber": 3, "sugar": 12,
        "serving_size": "60g", "price": 80,
        "allergens": ["tree_nuts"], "dietary_tags": ["vegan", "gluten_free", "dairy_free"],
        "image_url": "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600",
        "nutritional_benefits": "Almonds and cashews provide vitamin E and magnesium for heart health. Dark chocolate contains flavonoids that improve blood flow. A portable snack with healthy fats that curb hunger between meals.",
    },
    {
        "name": "Protein Bar",
        "description": "Whey protein bar with peanut butter, oats, and dark chocolate coating.",
        "category": "snack",
        "calories": 250, "protein": 20, "carbs": 28, "fat": 8, "fiber": 3, "sugar": 10,
        "serving_size": "65g", "price": 70,
        "allergens": ["dairy", "peanuts", "wheat"], "dietary_tags": ["high_protein"],
        "image_url": "https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=600",
        "nutritional_benefits": "Whey protein is rapidly absorbed, making it ideal for post-workout recovery. Oats provide slow-release energy to prevent crashes. Peanut butter adds satiety with healthy fats and plant protein.",
    },
    {
        "name": "Grilled Fish Tacos",
        "description": "Blackened white fish in corn tortillas with mango salsa, cabbage slaw, and lime crema.",
        "category": "lunch",
        "calories": 440, "protein": 32, "carbs": 42, "fat": 16, "fiber": 5, "sugar": 8,
        "serving_size": "340g", "price": 190,
        "allergens": ["fish", "dairy"], "dietary_tags": ["high_protein"],
        "image_url": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600",
        "nutritional_benefits": "White fish is a lean protein that's easy to digest and low in mercury. Mango salsa adds vitamin A and natural sweetness. Corn tortillas are whole grain and naturally gluten-free.",
    },
    {
        "name": "Keto Chicken Thighs",
        "description": "Crispy skin chicken thighs with cauliflower mash, roasted asparagus, and herb butter.",
        "category": "dinner",
        "calories": 520, "protein": 42, "carbs": 8, "fat": 36, "fiber": 4, "sugar": 3,
        "serving_size": "380g", "price": 210,
        "allergens": ["dairy"], "dietary_tags": ["keto", "low_carb", "high_protein", "gluten_free"],
        "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600",
        "nutritional_benefits": "Ideal for ketogenic diets with very low carbs and high healthy fats. Cauliflower is rich in vitamin C and choline. Asparagus provides folate and is a natural diuretic that helps reduce bloating.",
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
        # Seed app settings (global macro pricing)
        existing_settings = await session.execute(select(AppSettings).limit(1))
        if existing_settings.scalar():
            print("App settings already exist, skipping...")
        else:
            print("Inserting default app settings...")
            session.add(AppSettings(
                protein_price_per_gram=3.0,
                carbs_price_per_gram=1.0,
                fat_price_per_gram=1.5,
            ))
            await session.flush()
            print("App settings inserted.")

        # Seed meals
        existing_meals = await session.execute(select(Meal).limit(1))
        if existing_meals.scalar():
            print("Meals already exist, skipping...")
        else:
            print(f"Inserting {len(SEED_MEALS)} meals...")
            for meal_data in SEED_MEALS:
                session.add(Meal(**meal_data))
            await session.flush()
            print("Meals inserted.")

        # Seed delivery zones
        existing_zones = await session.execute(select(DeliveryZone).limit(1))
        if existing_zones.scalar():
            print("Delivery zones already exist, skipping...")
        else:
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

    await engine.dispose()
    print("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
