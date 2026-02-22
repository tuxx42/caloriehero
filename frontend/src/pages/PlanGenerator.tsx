import { useState } from "react";
import { useNavigate } from "react-router";
import {
  generatePlans,
  recalculatePlan,
} from "../api/endpoints/matching";
import type { DailyPlan } from "../api/types";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MacroBar } from "../components/common/MacroBar";
import { SlotSwapModal } from "../components/meals/SlotSwapModal";
import { useCartStore } from "../stores/cart";

const SLOT_EMOJI: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

const VARIANT_LABELS = ["Plan A", "Plan B", "Plan C"];

function formatExtra(value: number, label: string): string | null {
  if (value === 0) return null;
  return `${value > 0 ? "+" : ""}${value}g ${label}`;
}

export function PlanGeneratorPage() {
  const [variants, setVariants] = useState<DailyPlan[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapSlot, setSwapSlot] = useState<{
    slot: string;
    currentMealId: string;
  } | null>(null);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const activePlan = variants[activeIndex] ?? null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generatePlans(3);
      setVariants(result);
      setActiveIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async (slot: string, newMealId: string) => {
    if (!activePlan) return;
    setSwapSlot(null);
    setSwapping(true);
    try {
      const newItems = activePlan.items.map((item) =>
        item.slot === slot
          ? { slot, meal_id: newMealId }
          : { slot: item.slot, meal_id: item.meal_id },
      );
      const recalculated = await recalculatePlan(newItems);
      setVariants((prev) =>
        prev.map((v, i) => (i === activeIndex ? recalculated : v)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to swap meal",
      );
    } finally {
      setSwapping(false);
    }
  };

  const handleAddPlanToCart = () => {
    if (!activePlan) return;
    for (const item of activePlan.items) {
      addItem(item.meal, {
        extraProtein: item.extra_protein,
        extraCarbs: item.extra_carbs,
        extraFat: item.extra_fat,
      });
    }
    navigate("/cart");
  };

  const planTotalPrice = activePlan
    ? activePlan.items.reduce((sum, item) => sum + item.meal.price, 0) +
      activePlan.total_extra_price
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
          : variants.length > 0
            ? "Regenerate Plans"
            : "Generate Plans"}
      </button>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Variant tabs */}
      {variants.length > 1 && !loading && (
        <div className="flex gap-2">
          {variants.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-colors ${
                i === activeIndex
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {VARIANT_LABELS[i] ?? `Plan ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {activePlan && !loading && (
        <>
          {/* Score + macros */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Daily Overview</h2>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                {Math.round(activePlan.total_score * 100)}% match
              </span>
            </div>
            <MacroBar
              label="Calories"
              value={activePlan.actual_macros.calories}
              target={activePlan.target_macros.calories}
              unit="kcal"
            />
            <MacroBar
              label="Protein"
              value={activePlan.actual_macros.protein}
              target={activePlan.target_macros.protein}
              color="bg-blue-500"
            />
            <MacroBar
              label="Carbs"
              value={activePlan.actual_macros.carbs}
              target={activePlan.target_macros.carbs}
              color="bg-amber-500"
            />
            <MacroBar
              label="Fat"
              value={activePlan.actual_macros.fat}
              target={activePlan.target_macros.fat}
              color="bg-rose-500"
            />
          </div>

          {/* Slot cards */}
          <div className="space-y-3">
            {activePlan.items.map((item) => {
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
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                          >
                            Swap
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{item.meal_name}</p>
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
      {swapSlot && activePlan && (
        <SlotSwapModal
          slot={swapSlot.slot}
          currentMealId={swapSlot.currentMealId}
          planMealIds={activePlan.items.map((i) => i.meal_id)}
          onSwap={handleSwap}
          onClose={() => setSwapSlot(null)}
        />
      )}
    </div>
  );
}
