import { useEffect, useState } from "react";
import { listMeals } from "../api/endpoints/meals";
import { getPricing } from "../api/endpoints/settings";
import type { Meal, PricingConfig } from "../api/types";
import { MealCard } from "../components/common/MealCard";
import { MealCustomizer } from "../components/meals/MealCustomizer";
import { MealDatasheet } from "../components/meals/MealDatasheet";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useCartStore } from "../stores/cart";
import { useProfileStore } from "../stores/profile";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [infoMeal, setInfoMeal] = useState<Meal | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const setPricingRates = useCartStore((s) => s.setPricingRates);
  const profile = useProfileStore((s) => s.profile);
  const targetMacros = profile?.macro_targets ?? null;

  useEffect(() => {
    getPricing()
      .then((p) => {
        setPricing(p);
        setPricingRates(p);
      })
      .catch(console.error);
  }, [setPricingRates]);

  useEffect(() => {
    setLoading(true);
    listMeals(category || undefined)
      .then(setMeals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Menu</h1>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              category === cat.value
                ? "bg-emerald-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : meals.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No meals found</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onAddToCart={() => setSelectedMeal(meal)}
              onSelect={() => setSelectedMeal(meal)}
              onInfo={() => setInfoMeal(meal)}
            />
          ))}
        </div>
      )}

      {/* Customizer modal */}
      {selectedMeal && (
        <MealCustomizer
          meal={selectedMeal}
          pricing={pricing}
          onAdd={addItem}
          onClose={() => setSelectedMeal(null)}
        />
      )}

      {/* Meal datasheet modal */}
      {infoMeal && targetMacros && (
        <MealDatasheet
          meal={infoMeal}
          targetMacros={targetMacros}
          onClose={() => setInfoMeal(null)}
        />
      )}
    </div>
  );
}
