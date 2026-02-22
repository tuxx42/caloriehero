import { Link } from "react-router";
import { PlanSummaryBadge } from "../components/cart/PlanSummaryBadge";
import { WeightProjectionCard } from "../components/common/WeightProjectionCard";
import { useCartStore, type CartItem } from "../stores/cart";
import { useProfileStore } from "../stores/profile";
import type { BodyStats } from "../utils/tdee";
import { calculateWeightProjection } from "../utils/weightProjection";
import { CartIcon, CloseIcon } from "../components/icons/Icons";

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  unitPrice,
}: {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  unitPrice: number;
}) {
  const { meal, quantity, extraProtein, extraCarbs, extraFat } = item;
  const hasExtras = extraProtein !== 0 || extraCarbs !== 0 || extraFat !== 0;
  const extraParts = [
    extraProtein !== 0 && `${extraProtein > 0 ? "+" : ""}${extraProtein}g P`,
    extraCarbs !== 0 && `${extraCarbs > 0 ? "+" : ""}${extraCarbs}g C`,
    extraFat !== 0 && `${extraFat > 0 ? "+" : ""}${extraFat}g F`,
  ].filter(Boolean);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-stone-900 text-sm truncate">
          {meal.name}
        </h3>
        <p className="text-xs text-stone-500">
          {Math.round(meal.calories)} cal · ฿{Math.round(unitPrice)}
        </p>
        {hasExtras && (
          <p className="text-xs text-emerald-600 mt-0.5">
            {extraParts.join(", ")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.id, quantity - 1)}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
        >
          -
        </button>
        <span className="w-6 text-center font-semibold text-sm">
          {quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.id, quantity + 1)}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="ml-2 text-red-400 hover:text-red-600 transition-colors"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function CartPage() {
  const { items, updateQuantity, removeItem, removePlan, total, clearCart, itemPrice, planContexts } =
    useCartStore();
  const profile = useProfileStore((s) => s.profile);

  // Derive body stats and weight projection from plan contexts + profile
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

  // Aggregate weight projection across all plans
  const weightProjection =
    planContexts.length > 0 && bodyStats
      ? (() => {
          const totalDays = planContexts.reduce((s, c) => s + c.numDays, 0);
          const totalCalDays = planContexts.reduce(
            (s, c) =>
              s + c.dailySummaries.reduce((sd, d) => sd + d.actual_macros.calories, 0),
            0,
          );
          const avgCalories = totalCalDays / totalDays;
          return calculateWeightProjection(bodyStats, avgCalories, totalDays);
        })()
      : null;

  if (items.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="flex justify-center mb-4">
          <CartIcon className="w-16 h-16 text-stone-300" />
        </div>
        <h2 className="font-display text-xl text-stone-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-stone-500 mb-6">Add some meals to get started</p>
        <Link
          to="/meals"
          className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          Browse Meals
        </Link>
      </div>
    );
  }

  // Group items by plan
  const planGroups = planContexts.map((ctx) => ({
    plan: ctx,
    items: items.filter((i) => i.planId === ctx.id),
  }));
  const looseItems = items.filter((i) => !i.planId);

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-xl text-stone-900">Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 font-medium hover:text-red-600 transition-colors"
        >
          Clear all
        </button>
      </div>

      {weightProjection && bodyStats && (
        <WeightProjectionCard
          projection={weightProjection}
          currentWeight={bodyStats.weight}
        />
      )}

      {/* Plan groups */}
      {planGroups.map((group) => (
        <div key={group.plan.id} className="space-y-3">
          <PlanSummaryBadge
            planContexts={[group.plan]}
            onRemove={removePlan}
          />
          {group.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              unitPrice={itemPrice(item)}
            />
          ))}
        </div>
      ))}

      {/* Loose items (added individually, not from a plan) */}
      {looseItems.length > 0 && (
        <div className="space-y-3">
          {planGroups.length > 0 && (
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">
              Individual items
            </h2>
          )}
          {looseItems.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              unitPrice={itemPrice(item)}
            />
          ))}
        </div>
      )}

      {/* Total + Checkout */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-stone-600">Total</span>
          <span className="text-xl font-bold text-stone-900">
            ฿{total().toFixed(0)}
          </span>
        </div>
        <Link
          to="/checkout"
          className="block w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl text-center hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
