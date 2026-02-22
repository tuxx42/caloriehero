import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listMeals } from "../api/endpoints/meals";
import type { Meal } from "../api/types";
import { MealCard } from "../components/common/MealCard";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useCartStore } from "../stores/cart";
import { useAuthStore } from "../stores/auth";

export function HomePage() {
  const [featured, setFeatured] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    listMeals()
      .then((meals) => setFeatured(meals.slice(0, 6)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="relative rounded-2xl p-6 md:p-10 text-white overflow-hidden"
      >
        <img
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/80 to-emerald-900/70" />
        <div className="relative z-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Hey {user?.name?.split(" ")[0] ?? "there"}!
        </h1>
        <p className="text-emerald-100 mb-4">
          Meals matched to your macro targets, delivered fresh.
        </p>
        <div className="flex gap-3">
          <Link
            to="/plan"
            className="px-4 py-2 bg-white text-emerald-600 font-semibold rounded-lg text-sm hover:bg-emerald-50 transition-colors"
          >
            Generate Plan
          </Link>
          <Link
            to="/meals"
            className="px-4 py-2 bg-emerald-400 text-white font-semibold rounded-lg text-sm hover:bg-emerald-300 transition-colors"
          >
            Browse Meals
          </Link>
        </div>
        </div>
      </div>

      {/* Featured meals */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Popular Meals</h2>
          <Link
            to="/meals"
            className="text-sm text-emerald-600 font-medium"
          >
            See all
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {featured.map((meal) => (
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
    </div>
  );
}
