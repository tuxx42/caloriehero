import type { Meal, Allergen, DietaryTag, MealCategory } from "@caloriehero/shared-types";

// ---------------------------------------------------------------------------
// Allergen filtering
// ---------------------------------------------------------------------------

/**
 * Removes meals that contain any of the listed allergens.
 * Strict: no false negatives — if a meal lists the allergen it is excluded.
 */
export function filterByAllergens(meals: Meal[], allergies: Allergen[]): Meal[] {
  if (allergies.length === 0) return meals;
  const allergenSet = new Set<Allergen>(allergies);
  return meals.filter(
    (meal) => !meal.allergens.some((a) => allergenSet.has(a))
  );
}

// ---------------------------------------------------------------------------
// Dietary tag filtering
// ---------------------------------------------------------------------------

/**
 * Keeps only meals that have ALL listed dietary tags (AND logic).
 */
export function filterByDietaryTags(
  meals: Meal[],
  preferences: DietaryTag[]
): Meal[] {
  if (preferences.length === 0) return meals;
  return meals.filter((meal) =>
    preferences.every((tag) => meal.dietaryTags.includes(tag))
  );
}

// ---------------------------------------------------------------------------
// Category filtering
// ---------------------------------------------------------------------------

/**
 * Keeps only meals belonging to the given category.
 */
export function filterByCategory(meals: Meal[], category: MealCategory): Meal[] {
  return meals.filter((meal) => meal.category === category);
}

// ---------------------------------------------------------------------------
// Combined filter pipeline
// ---------------------------------------------------------------------------

export interface FilterOptions {
  allergies?: Allergen[];
  dietaryPreferences?: DietaryTag[];
  category?: MealCategory;
}

/**
 * Runs all applicable filters in sequence: allergens → dietary tags → category.
 */
export function filterMeals(meals: Meal[], opts: FilterOptions): Meal[] {
  let result = meals;

  if (opts.allergies && opts.allergies.length > 0) {
    result = filterByAllergens(result, opts.allergies);
  }

  if (opts.dietaryPreferences && opts.dietaryPreferences.length > 0) {
    result = filterByDietaryTags(result, opts.dietaryPreferences);
  }

  if (opts.category !== undefined) {
    result = filterByCategory(result, opts.category);
  }

  return result;
}
