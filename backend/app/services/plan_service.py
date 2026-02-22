"""Plan service — wire meal plan engine to DB."""

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.engine.constants import DEFAULT_SLOT_PERCENTAGES
from app.engine.daily_planner import generate_daily_plan
from app.engine.per_meal_matcher import match_meals
from app.engine.scoring import calculate_score
from app.engine.slot_allocator import allocate_slots
from app.engine.types import (
    MacroTargets,
    MealMatchRequest,
    NutritionalInfo,
    PlanRequest,
    PlanResult,
)
from app.engine.types import (
    Meal as EngineMeal,
)
from app.engine.variant_generator import generate_plan_variants
from app.models.meal import Meal
from app.models.meal_plan import MealPlan, MealPlanItem
from app.models.user import User, UserProfile
from app.services.pricing_service import calculate_item_price


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


def _db_meal_to_response(db_meal: Meal) -> dict:
    """Convert SQLAlchemy Meal to a response dict."""
    return {
        "id": str(db_meal.id),
        "name": db_meal.name,
        "description": db_meal.description,
        "category": db_meal.category,
        "calories": db_meal.calories,
        "protein": db_meal.protein,
        "carbs": db_meal.carbs,
        "fat": db_meal.fat,
        "fiber": db_meal.fiber,
        "sugar": db_meal.sugar,
        "serving_size": db_meal.serving_size,
        "price": db_meal.price,
        "allergens": db_meal.allergens or [],
        "dietary_tags": db_meal.dietary_tags or [],
        "image_url": db_meal.image_url,
        "active": db_meal.active,
        "protein_price_per_gram": db_meal.protein_price_per_gram,
        "carbs_price_per_gram": db_meal.carbs_price_per_gram,
        "fat_price_per_gram": db_meal.fat_price_per_gram,
    }


async def _load_user_targets(
    db: AsyncSession, user_id: uuid.UUID
) -> tuple[MacroTargets, list[str], list[str]]:
    """Load user profile and return (targets, allergies, preferences)."""
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
        return MacroTargets(calories=2000, protein=150, carbs=200, fat=65), [], []

    mt = profile.macro_targets
    targets = MacroTargets(
        calories=mt["calories"],
        protein=mt["protein"],
        carbs=mt["carbs"],
        fat=mt["fat"],
    )
    return targets, profile.allergies or [], profile.dietary_preferences or []


async def _load_active_meals(db: AsyncSession) -> list[Meal]:
    """Load all active meals from DB."""
    meals_result = await db.execute(
        select(Meal).where(Meal.active.is_(True))
    )
    return list(meals_result.scalars().all())


async def _build_plan_response(
    db: AsyncSession,
    plan_result: PlanResult,
    targets: MacroTargets,
    db_meals_by_id: dict[str, Meal],
    variant_id: str | None = None,
) -> dict:
    """Convert a PlanResult into an API response dict with auto-extras."""
    slot_pcts = {
        str(s["slot"]): float(s["percentage"])
        for s in DEFAULT_SLOT_PERCENTAGES
    }

    delta_protein = targets.protein - plan_result.actual_macros.protein
    delta_carbs = targets.carbs - plan_result.actual_macros.carbs
    delta_fat = targets.fat - plan_result.actual_macros.fat

    item_extras: list[dict[str, float]] = []
    for item in plan_result.items:
        pct = slot_pcts[item.slot]
        ni = item.meal.nutritional_info
        ep = round(max(-ni.protein, delta_protein * pct))
        ec = round(max(-ni.carbs, delta_carbs * pct))
        ef = round(max(-ni.fat, delta_fat * pct))
        item_extras.append({"extra_protein": ep, "extra_carbs": ec, "extra_fat": ef})

    # Recalculate actual macros including extras
    adjusted_protein = plan_result.actual_macros.protein + sum(
        e["extra_protein"] for e in item_extras
    )
    adjusted_carbs = plan_result.actual_macros.carbs + sum(
        e["extra_carbs"] for e in item_extras
    )
    adjusted_fat = plan_result.actual_macros.fat + sum(
        e["extra_fat"] for e in item_extras
    )
    adjusted_calories = (
        adjusted_protein * 4 + adjusted_carbs * 4 + adjusted_fat * 9
    )

    # Calculate extra prices per item
    total_extra_price = 0.0
    item_extra_prices: list[float] = []
    for i, item in enumerate(plan_result.items):
        extras = item_extras[i]
        db_meal = db_meals_by_id[item.meal.id]
        extra_price = await calculate_item_price(
            db, db_meal,
            extras["extra_protein"], extras["extra_carbs"], extras["extra_fat"],
        ) - db_meal.price
        item_extra_prices.append(round(extra_price, 2))
        total_extra_price += extra_price

    response_items = []
    for i, item in enumerate(plan_result.items):
        extras = item_extras[i]
        db_meal = db_meals_by_id[item.meal.id]
        response_items.append({
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
            "extra_protein": extras["extra_protein"],
            "extra_carbs": extras["extra_carbs"],
            "extra_fat": extras["extra_fat"],
            "extra_price": item_extra_prices[i],
            "meal": _db_meal_to_response(db_meal),
        })

    return {
        "id": variant_id or str(uuid.uuid4()),
        "date": date.today().isoformat(),
        "total_score": round(plan_result.total_score, 4),
        "actual_macros": {
            "calories": round(adjusted_calories, 1),
            "protein": round(adjusted_protein, 1),
            "carbs": round(adjusted_carbs, 1),
            "fat": round(adjusted_fat, 1),
        },
        "target_macros": {
            "calories": targets.calories,
            "protein": targets.protein,
            "carbs": targets.carbs,
            "fat": targets.fat,
        },
        "total_extra_price": round(total_extra_price, 2),
        "items": response_items,
    }


async def match_meals_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 10,
) -> list[dict]:
    """Match meals based on user profile targets."""
    targets, allergies, preferences = await _load_user_targets(db, user_id)
    db_meals = await _load_active_meals(db)
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
    targets, allergies, preferences = await _load_user_targets(db, user_id)
    db_meals = await _load_active_meals(db)
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

    db_meals_by_id = {str(m.id): m for m in db_meals}
    response = await _build_plan_response(db, plan_result, targets, db_meals_by_id)

    # Persist
    plan = MealPlan(
        user_id=user_id,
        date=date.today().isoformat(),
        total_score=response["total_score"],
        actual_macros=response["actual_macros"],
        target_macros=response["target_macros"],
    )
    db.add(plan)
    await db.flush()

    for item_data in response["items"]:
        plan_item = MealPlanItem(
            plan_id=plan.id,
            slot=item_data["slot"],
            meal_id=uuid.UUID(item_data["meal_id"]),
            score=item_data["score"],
            slot_targets=item_data["slot_targets"],
            extra_protein=item_data["extra_protein"],
            extra_carbs=item_data["extra_carbs"],
            extra_fat=item_data["extra_fat"],
        )
        db.add(plan_item)

    await db.commit()
    await db.refresh(plan)

    response["id"] = str(plan.id)
    return response


async def generate_plans_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    count: int = 3,
) -> list[dict]:
    """Generate multiple plan variants without persisting."""
    targets, allergies, preferences = await _load_user_targets(db, user_id)
    db_meals = await _load_active_meals(db)
    engine_meals = [_db_meal_to_engine(m) for m in db_meals]

    request = PlanRequest(
        daily_targets=targets,
        slots=DEFAULT_SLOT_PERCENTAGES,
        allergies=allergies,
        dietary_preferences=preferences,
    )
    variants = generate_plan_variants(engine_meals, request, count=count)

    db_meals_by_id = {str(m.id): m for m in db_meals}
    results = []
    for variant in variants:
        variant_id = str(uuid.uuid4())
        resp = await _build_plan_response(
            db, variant, targets, db_meals_by_id, variant_id=variant_id
        )
        results.append(resp)
    return results


async def get_slot_alternatives(
    db: AsyncSession,
    user_id: uuid.UUID,
    slot: str,
    exclude_meal_ids: list[str],
    limit: int = 5,
) -> list[dict]:
    """Get alternative meals for a specific slot."""
    targets, allergies, preferences = await _load_user_targets(db, user_id)
    db_meals = await _load_active_meals(db)

    # Compute slot-level targets
    slot_allocations = allocate_slots(targets, DEFAULT_SLOT_PERCENTAGES)
    slot_targets = next(
        (a.targets for a in slot_allocations if a.slot == slot), None
    )
    if slot_targets is None:
        raise ValueError(f"Invalid slot: {slot}")

    engine_meals = [_db_meal_to_engine(m) for m in db_meals]

    request = MealMatchRequest(
        targets=slot_targets,
        allergies=allergies,
        dietary_preferences=preferences,
        category=slot,  # type: ignore[arg-type]
        limit=limit + len(exclude_meal_ids),
    )
    scored = match_meals(engine_meals, request)

    # Filter out excluded meals and re-apply limit
    exclude_set = set(exclude_meal_ids)
    db_meals_by_id = {str(m.id): m for m in db_meals}

    results = []
    for s in scored:
        if s.meal.id in exclude_set:
            continue
        db_meal = db_meals_by_id.get(s.meal.id)
        result: dict = {
            "meal_id": s.meal.id,
            "meal_name": s.meal.name,
            "score": round(s.score, 4),
            "category": s.meal.category,
        }
        if db_meal:
            result["meal"] = _db_meal_to_response(db_meal)
        results.append(result)
        if len(results) >= limit:
            break

    return results


async def recalculate_plan(
    db: AsyncSession,
    user_id: uuid.UUID,
    items: list[dict],
) -> dict | None:
    """Recalculate a plan from a custom set of slot+meal pairs."""
    from app.engine.constants import DEFAULT_SCORING_WEIGHTS

    targets, _allergies, _preferences = await _load_user_targets(db, user_id)
    db_meals = await _load_active_meals(db)
    db_meals_by_id = {str(m.id): m for m in db_meals}

    # Compute slot targets
    slot_allocations = allocate_slots(targets, DEFAULT_SLOT_PERCENTAGES)
    allocation_map = {a.slot: a for a in slot_allocations}

    from app.engine.types import PlanItem as EnginePlanItem

    plan_items = []
    total_score = 0.0
    total_calories = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0

    for item_input in items:
        slot = item_input["slot"]
        meal_id = item_input["meal_id"]
        db_meal = db_meals_by_id.get(meal_id)
        if db_meal is None:
            raise ValueError(f"Meal not found: {meal_id}")
        allocation = allocation_map.get(slot)
        if allocation is None:
            raise ValueError(f"Invalid slot: {slot}")

        engine_meal = _db_meal_to_engine(db_meal)
        score = calculate_score(
            engine_meal.nutritional_info,
            allocation.targets,
            DEFAULT_SCORING_WEIGHTS,
        )
        plan_items.append(EnginePlanItem(
            slot=slot,  # type: ignore[arg-type]
            meal=engine_meal,
            score=score,
            slot_targets=allocation.targets,
        ))
        total_score += score
        total_calories += engine_meal.nutritional_info.calories
        total_protein += engine_meal.nutritional_info.protein
        total_carbs += engine_meal.nutritional_info.carbs
        total_fat += engine_meal.nutritional_info.fat

    avg_score = total_score / len(plan_items) if plan_items else 0.0

    plan_result = PlanResult(
        items=plan_items,
        total_score=avg_score,
        actual_macros=NutritionalInfo(
            calories=total_calories,
            protein=total_protein,
            carbs=total_carbs,
            fat=total_fat,
        ),
        target_macros=targets,
    )

    return await _build_plan_response(db, plan_result, targets, db_meals_by_id)
