import { useEffect, useState } from "react";
import { listMeals } from "../api/endpoints/meals";
import type { Meal } from "../api/types";
import { MealCard } from "../components/common/MealCard";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useCartStore } from "../stores/cart";

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
  const addItem = useCartStore((s) => s.addItem);

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
              onAddToCart={addItem}
              onSelect={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
