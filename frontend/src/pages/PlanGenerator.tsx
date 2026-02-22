import { useState } from "react";
import { useNavigate } from "react-router";
import {
  generatePlan,
  recalculatePlan,
} from "../api/endpoints/matching";
import type { DailyPlan, PlanItem } from "../api/types";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MacroBar } from "../components/common/MacroBar";
import { MealDatasheet } from "../components/meals/MealDatasheet";
import { PlanDatasheet } from "../components/meals/PlanDatasheet";
import { SlotSwapModal } from "../components/meals/SlotSwapModal";
import { useCartStore } from "../stores/cart";

const SLOT_EMOJI: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

function formatExtra(value: number, label: string): string | null {
  if (value === 0) return null;
  return `${value > 0 ? "+" : ""}${value}g ${label}`;
}

export function PlanGeneratorPage() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapSlot, setSwapSlot] = useState<{
    slot: string;
    currentMealId: string;
  } | null>(null);
  const [detailItem, setDetailItem] = useState<PlanItem | null>(null);
  const [showPlanDatasheet, setShowPlanDatasheet] = useState(false);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generatePlan();
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async (slot: string, newMealId: string) => {
    if (!plan) return;
    setSwapSlot(null);
    setSwapping(true);
    try {
      const newItems = plan.items.map((item) =>
        item.slot === slot
          ? { slot, meal_id: newMealId }
          : { slot: item.slot, meal_id: item.meal_id },
      );
      const recalculated = await recalculatePlan(newItems);
      setPlan(recalculated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to swap meal",
      );
    } finally {
      setSwapping(false);
    }
  };

  const handleAddPlanToCart = () => {
    if (!plan) return;
    for (const item of plan.items) {
      addItem(item.meal, {
        extraProtein: item.extra_protein,
        extraCarbs: item.extra_carbs,
        extraFat: item.extra_fat,
      });
    }
    navigate("/cart");
  };

  const planTotalPrice = plan
    ? plan.items.reduce((sum, item) => sum + item.meal.price, 0) +
      plan.total_extra_price
    : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Daily Meal Plan
        </h1>
        <p className="text-sm text-gray-500">
          AI-matched meals to hit your macro targets
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {loading
          ? "Generating..."
          : plan
            ? "Regenerate Plan"
            : "Generate Plan"}
      </button>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {plan && !loading && (
        <>
          {/* Score + macros */}
          <button
            type="button"
            onClick={() => setShowPlanDatasheet(true)}
            className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3 hover:border-emerald-200 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-900">Daily Overview</h2>
                <span className="text-xs text-gray-400">Tap for details</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                  {Math.round(plan.total_score * 100)}% match
                </span>
                <span className="text-gray-300 text-sm">›</span>
              </div>
            </div>
            <MacroBar
              label="Calories"
              value={plan.actual_macros.calories}
              target={plan.target_macros.calories}
              unit="kcal"
            />
            <MacroBar
              label="Protein"
              value={plan.actual_macros.protein}
              target={plan.target_macros.protein}
              color="bg-blue-500"
            />
            <MacroBar
              label="Carbs"
              value={plan.actual_macros.carbs}
              target={plan.target_macros.carbs}
              color="bg-amber-500"
            />
            <MacroBar
              label="Fat"
              value={plan.actual_macros.fat}
              target={plan.target_macros.fat}
              color="bg-rose-500"
            />
          </button>

          {/* Slot cards */}
          <div className="space-y-3">
            {plan.items.map((item) => {
              const extras = [
                formatExtra(item.extra_protein, "P"),
                formatExtra(item.extra_carbs, "C"),
                formatExtra(item.extra_fat, "F"),
              ].filter(Boolean);

              return (
                <div
                  key={item.slot}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {SLOT_EMOJI[item.slot] ?? "🍽️"}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 capitalize text-sm">
                          {item.slot}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 font-medium">
                            {Math.round(item.score * 100)}% match
                          </span>
                          <button
                            onClick={() =>
                              setSwapSlot({
                                slot: item.slot,
                                currentMealId: item.meal_id,
                              })
                            }
                            disabled={swapping}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                          >
                            Swap
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => setDetailItem(item)}
                        className="text-sm text-gray-700 hover:text-emerald-600 text-left transition-colors"
                      >
                        {item.meal_name}
                      </button>
                      {extras.length > 0 && (
                        <p className="text-xs text-indigo-600 mt-0.5">
                          {extras.join(", ")}
                        </p>
                      )}
                      {item.extra_price > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Extra: ฿{item.extra_price.toFixed(0)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div>
                      <div className="font-semibold">
                        {Math.round(item.slot_targets.calories)}
                      </div>
                      <div className="text-gray-400">cal</div>
                    </div>
                    <div>
                      <div className="font-semibold text-blue-600">
                        {Math.round(item.slot_targets.protein)}g
                      </div>
                      <div className="text-gray-400">pro</div>
                    </div>
                    <div>
                      <div className="font-semibold text-amber-600">
                        {Math.round(item.slot_targets.carbs)}g
                      </div>
                      <div className="text-gray-400">carb</div>
                    </div>
                    <div>
                      <div className="font-semibold text-rose-600">
                        {Math.round(item.slot_targets.fat)}g
                      </div>
                      <div className="text-gray-400">fat</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Plan to Cart */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total plan price</span>
              <span className="text-xl font-bold text-gray-900">
                ฿{planTotalPrice.toFixed(0)}
              </span>
            </div>
            <button
              onClick={handleAddPlanToCart}
              className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
            >
              Add Plan to Cart
            </button>
          </div>
        </>
      )}

      {/* Swap modal */}
      {swapSlot && plan && (
        <SlotSwapModal
          slot={swapSlot.slot}
          currentMealId={swapSlot.currentMealId}
          planMealIds={plan.items.map((i) => i.meal_id)}
          onSwap={handleSwap}
          onClose={() => setSwapSlot(null)}
        />
      )}

      {/* Meal datasheet modal */}
      {detailItem && plan && (
        <MealDatasheet
          meal={detailItem.meal}
          targetMacros={plan.target_macros}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* Plan datasheet modal */}
      {showPlanDatasheet && plan && (
        <PlanDatasheet
          plan={plan}
          onClose={() => setShowPlanDatasheet(false)}
        />
      )}
    </div>
  );
}
