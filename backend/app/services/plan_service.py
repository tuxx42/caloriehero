"""Plan service — wire meal plan engine to DB."""

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.engine.daily_planner import generate_daily_plan
from app.engine.per_meal_matcher import match_meals
from app.engine.types import (
    MacroTargets,
    MealMatchRequest,
    NutritionalInfo,
    PlanRequest,
)
from app.engine.types import (
    Meal as EngineMeal,
)
from app.models.meal import Meal
from app.models.meal_plan import MealPlan, MealPlanItem
from app.models.user import User, UserProfile


def _db_meal_to_engine(meal: Meal) -> EngineMeal:
    """Convert SQLAlchemy Meal to engine Meal dataclass."""
    return EngineMeal(
        id=str(meal.id),
        name=meal.name,
        description=meal.description,
        category=meal.category,
        nutritional_info=NutritionalInfo(
            calories=meal.calories,
            protein=meal.protein,
            carbs=meal.carbs,
            fat=meal.fat,
        ),
        serving_size=meal.serving_size,
        price=meal.price,
        allergens=meal.allergens or [],
        dietary_tags=meal.dietary_tags or [],
    )


async def match_meals_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 10,
) -> list[dict]:
    """Match meals based on user profile targets."""
    # Load user profile
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError("User not found")

    profile: UserProfile | None = user.profile
    if profile is None:
        targets = MacroTargets(calories=2000, protein=150, carbs=200, fat=65)
        allergies: list[str] = []
        preferences: list[str] = []
    else:
        mt = profile.macro_targets
        targets = MacroTargets(
            calories=mt["calories"],
            protein=mt["protein"],
            carbs=mt["carbs"],
            fat=mt["fat"],
        )
        allergies = profile.allergies or []
        preferences = profile.dietary_preferences or []

    # Load active meals
    meals_result = await db.execute(
        select(Meal).where(Meal.active.is_(True))
    )
    db_meals = meals_result.scalars().all()
    engine_meals = [_db_meal_to_engine(m) for m in db_meals]

    request = MealMatchRequest(
        targets=targets,
        allergies=allergies,
        dietary_preferences=preferences,
        limit=limit,
    )
    scored = match_meals(engine_meals, request)

    return [
        {
            "meal_id": s.meal.id,
            "meal_name": s.meal.name,
            "score": round(s.score, 4),
            "category": s.meal.category,
        }
        for s in scored
    ]


async def generate_plan_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> dict | None:
    """Generate a daily plan and persist it."""
    from app.engine.constants import DEFAULT_SLOT_PERCENTAGES

    # Load user profile
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError("User not found")

    profile: UserProfile | None = user.profile
    if profile is None:
        targets = MacroTargets(calories=2000, protein=150, carbs=200, fat=65)
        allergies: list[str] = []
        preferences: list[str] = []
    else:
        mt = profile.macro_targets
        targets = MacroTargets(
            calories=mt["calories"],
            protein=mt["protein"],
            carbs=mt["carbs"],
            fat=mt["fat"],
        )
        allergies = profile.allergies or []
        preferences = profile.dietary_preferences or []

    # Load active meals
    meals_result = await db.execute(
        select(Meal).where(Meal.active.is_(True))
    )
    db_meals = meals_result.scalars().all()
    engine_meals = [_db_meal_to_engine(m) for m in db_meals]

    request = PlanRequest(
        daily_targets=targets,
        slots=DEFAULT_SLOT_PERCENTAGES,
        allergies=allergies,
        dietary_preferences=preferences,
    )
    plan_result = generate_daily_plan(engine_meals, request)
    if plan_result is None:
        return None

    # Persist
    plan = MealPlan(
        user_id=user_id,
        date=date.today().isoformat(),
        total_score=round(plan_result.total_score, 4),
        actual_macros={
            "calories": plan_result.actual_macros.calories,
            "protein": plan_result.actual_macros.protein,
            "carbs": plan_result.actual_macros.carbs,
            "fat": plan_result.actual_macros.fat,
        },
        target_macros={
            "calories": plan_result.target_macros.calories,
            "protein": plan_result.target_macros.protein,
            "carbs": plan_result.target_macros.carbs,
            "fat": plan_result.target_macros.fat,
        },
    )
    db.add(plan)
    await db.flush()

    for item in plan_result.items:
        plan_item = MealPlanItem(
            plan_id=plan.id,
            slot=item.slot,
            meal_id=uuid.UUID(item.meal.id),
            score=round(item.score, 4),
            slot_targets={
                "calories": item.slot_targets.calories,
                "protein": item.slot_targets.protein,
                "carbs": item.slot_targets.carbs,
                "fat": item.slot_targets.fat,
            },
        )
        db.add(plan_item)

    await db.commit()
    await db.refresh(plan)

    return {
        "id": str(plan.id),
        "date": plan.date,
        "total_score": plan.total_score,
        "actual_macros": plan.actual_macros,
        "target_macros": plan.target_macros,
        "items": [
            {
                "slot": item.slot,
                "meal_id": item.meal.id,
                "meal_name": item.meal.name,
                "score": round(item.score, 4),
                "slot_targets": {
                    "calories": item.slot_targets.calories,
                    "protein": item.slot_targets.protein,
                    "carbs": item.slot_targets.carbs,
                    "fat": item.slot_targets.fat,
                },
            }
            for item in plan_result.items
        ],
    }
