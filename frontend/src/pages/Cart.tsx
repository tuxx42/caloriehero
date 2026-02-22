import { Link } from "react-router";
import { PlanSummaryBadge } from "../components/cart/PlanSummaryBadge";
import { WeightProjectionCard } from "../components/common/WeightProjectionCard";
import { useCartStore } from "../stores/cart";
import { useProfileStore } from "../stores/profile";
import type { BodyStats } from "../utils/tdee";
import { calculateWeightProjection } from "../utils/weightProjection";

export function CartPage() {
  const { items, updateQuantity, removeItem, total, clearCart, itemPrice, planContext } =
    useCartStore();
  const profile = useProfileStore((s) => s.profile);

  // Derive body stats and weight projection from plan context + profile
  const bodyStats: BodyStats | undefined =
    profile?.weight_kg != null &&
    profile?.height_cm != null &&
    profile?.age != null &&
    profile?.gender != null &&
    profile?.activity_level != null
      ? {
          weight: profile.weight_kg,
          height: profile.height_cm,
          age: profile.age,
          gender: profile.gender as BodyStats["gender"],
          activityLevel: profile.activity_level as BodyStats["activityLevel"],
        }
      : undefined;

  const weightProjection =
    planContext && bodyStats
      ? calculateWeightProjection(
          bodyStats,
          planContext.dailySummaries.reduce((s, d) => s + d.actual_macros.calories, 0) /
            planContext.dailySummaries.length,
          planContext.numDays,
        )
      : null;

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-6">Add some meals to get started</p>
        <Link
          to="/meals"
          className="inline-block px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
        >
          Browse Meals
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 font-medium"
        >
          Clear all
        </button>
      </div>

      {planContext && <PlanSummaryBadge planContext={planContext} />}

      {weightProjection && bodyStats && (
        <WeightProjectionCard
          projection={weightProjection}
          currentWeight={bodyStats.weight}
        />
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const { meal, quantity, extraProtein, extraCarbs, extraFat } = item;
          const unitP = itemPrice(item);
          const hasExtras = extraProtein !== 0 || extraCarbs !== 0 || extraFat !== 0;
          const extraParts = [
            extraProtein !== 0 && `${extraProtein > 0 ? "+" : ""}${extraProtein}g P`,
            extraCarbs !== 0 && `${extraCarbs > 0 ? "+" : ""}${extraCarbs}g C`,
            extraFat !== 0 && `${extraFat > 0 ? "+" : ""}${extraFat}g F`,
          ].filter(Boolean);

          return (
            <div
              key={`${meal.id}-${extraProtein}-${extraCarbs}-${extraFat}`}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {meal.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {Math.round(meal.calories)} cal · ฿{Math.round(unitP)}
                </p>
                {hasExtras && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {extraParts.join(", ")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(meal.id, quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                >
                  -
                </button>
                <span className="w-6 text-center font-medium text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => updateQuantity(meal.id, quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(meal.id)}
                  className="ml-2 text-red-400 hover:text-red-600 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total + Checkout */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Total</span>
          <span className="text-xl font-bold text-gray-900">
            ฿{total().toFixed(0)}
          </span>
        </div>
        <Link
          to="/checkout"
          className="block w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl text-center hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
