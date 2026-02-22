import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listMeals } from "../api/endpoints/meals";
import type { Meal } from "../api/types";
import { MealCard } from "../components/common/MealCard";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useCartStore } from "../stores/cart";
import { useAuthStore } from "../stores/auth";
import { ChartIcon, MealsIcon } from "../components/icons/Icons";

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
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden animate-fade-in">
        <img
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-emerald-800/70 to-stone-900/60" />
        <div className="relative z-10 px-6 py-10 md:px-10 md:py-14">
          <p className="text-emerald-300 text-sm font-medium tracking-wide uppercase mb-2 animate-slide-up">
            Macro-matched meals
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-3 animate-slide-up delay-1">
            Hey {user?.name?.split(" ")[0] ?? "there"}!
          </h1>
          <p className="text-stone-300 text-base max-w-md mb-6 animate-slide-up delay-2">
            Meals scientifically matched to your macro targets, prepared fresh and delivered to your door.
          </p>
          <div className="flex gap-3 animate-slide-up delay-3">
            <Link
              to="/plan"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 font-semibold rounded-xl text-sm hover:bg-emerald-50 transition-all duration-200 shadow-lg shadow-black/10"
            >
              <ChartIcon className="w-4 h-4" />
              Generate Plan
            </Link>
            <Link
              to="/meals"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white font-semibold rounded-xl text-sm hover:bg-white/25 transition-all duration-200 backdrop-blur-sm border border-white/20"
            >
              <MealsIcon className="w-4 h-4" />
              Browse Meals
            </Link>
          </div>
        </div>
      </div>

      {/* Featured meals */}
      <div>
        <div className="flex justify-between items-baseline mb-5">
          <h2 className="font-display text-2xl text-stone-900">Popular Meals</h2>
          <Link
            to="/meals"
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
          >
            See all
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {featured.map((meal, i) => (
              <div key={meal.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <MealCard
                  meal={meal}
                  onAddToCart={addItem}
                  onSelect={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
