import { useState } from "react";
import type { Meal, PricingConfig } from "../../api/types";
import type { MacroExtras } from "../../stores/cart";

interface MealCustomizerProps {
  meal: Meal;
  pricing: PricingConfig | null;
  onAdd: (meal: Meal, extras: MacroExtras) => void;
  onClose: () => void;
}

export function MealCustomizer({
  meal,
  pricing,
  onAdd,
  onClose,
}: MealCustomizerProps) {
  const [extraProtein, setExtraProtein] = useState(0);
  const [extraCarbs, setExtraCarbs] = useState(0);
  const [extraFat, setExtraFat] = useState(0);

  const proteinRate =
    meal.protein_price_per_gram ?? pricing?.protein_price_per_gram ?? 3;
  const carbsRate =
    meal.carbs_price_per_gram ?? pricing?.carbs_price_per_gram ?? 1;
  const fatRate =
    meal.fat_price_per_gram ?? pricing?.fat_price_per_gram ?? 1.5;

  const extraCost =
    Math.max(0, extraProtein) * proteinRate +
    Math.max(0, extraCarbs) * carbsRate +
    Math.max(0, extraFat) * fatRate;
  const totalPrice = meal.price + extraCost;

  const step = (
    current: number,
    setter: (v: number) => void,
    delta: number,
    floor: number,
  ) => {
    const next = current + delta;
    if (next >= floor) setter(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{meal.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {Math.round(meal.calories)} cal · {Math.round(meal.protein)}g P
              · {Math.round(meal.carbs)}g C · {Math.round(meal.fat)}g F
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Base price */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Base price</span>
          <span className="font-medium">฿{meal.price}</span>
        </div>

        {/* Macro sliders */}
        <div className="space-y-3">
          {[
            {
              label: "Protein",
              value: extraProtein,
              setter: setExtraProtein,
              rate: proteinRate,
              color: "blue",
              unit: "g",
              floor: -Math.round(meal.protein),
            },
            {
              label: "Carbs",
              value: extraCarbs,
              setter: setExtraCarbs,
              rate: carbsRate,
              color: "amber",
              unit: "g",
              floor: -Math.round(meal.carbs),
            },
            {
              label: "Fat",
              value: extraFat,
              setter: setExtraFat,
              rate: fatRate,
              color: "rose",
              unit: "g",
              floor: -Math.round(meal.fat),
            },
          ].map(({ label, value, setter, rate, color, unit, floor }) => (
            <div
              key={label}
              className="bg-gray-50 rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {label}
                </div>
                <div className="text-xs text-gray-400">
                  ฿{rate}/{unit} (add only)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => step(value, setter, -5, floor)}
                  disabled={value <= floor}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    value <= floor
                      ? "bg-gray-200 text-gray-400"
                      : `bg-${color}-100 text-${color}-600 hover:bg-${color}-200`
                  }`}
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold text-sm">
                  {value >= 0 ? "+" : ""}{value}{unit}
                </span>
                <button
                  onClick={() => step(value, setter, 5, floor)}
                  className={`w-8 h-8 rounded-full bg-${color}-100 text-${color}-600 hover:bg-${color}-200 flex items-center justify-center text-sm font-medium transition-colors`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Extra cost breakdown */}
        {extraCost > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Macro add-ons</span>
            <span className="font-medium">+฿{extraCost.toFixed(0)}</span>
          </div>
        )}

        {/* Total + Add button */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-xl font-bold text-gray-900">
              ฿{totalPrice.toFixed(0)}
            </div>
          </div>
          <button
            onClick={() => {
              onAdd(meal, { extraProtein, extraCarbs, extraFat });
              onClose();
            }}
            className="px-8 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
