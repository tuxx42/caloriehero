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
import { SunriseIcon, SunIcon, MoonIcon, AppleIcon } from "../components/icons/Icons";
import type { SVGProps } from "react";

const CATEGORIES: { value: string; label: string; Icon?: React.FC<SVGProps<SVGSVGElement>> }[] = [
  { value: "", label: "All" },
  { value: "breakfast", label: "Breakfast", Icon: SunriseIcon },
  { value: "lunch", label: "Lunch", Icon: SunIcon },
  { value: "dinner", label: "Dinner", Icon: MoonIcon },
  { value: "snack", label: "Snack", Icon: AppleIcon },
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
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-display text-2xl text-stone-900">Menu</h1>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              category === cat.value
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:border-stone-300"
            }`}
          >
            {cat.Icon && <cat.Icon className="w-4 h-4" />}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : meals.length === 0 ? (
        <p className="text-center text-stone-500 py-8">No meals found</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {meals.map((meal, i) => (
            <div key={meal.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <MealCard
                meal={meal}
                onAddToCart={() => setSelectedMeal(meal)}
                onSelect={() => setSelectedMeal(meal)}
                onInfo={() => setInfoMeal(meal)}
              />
            </div>
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
