import type { Meal, MacroTargets } from "../../api/types";
import { RadarChart } from "../common/RadarChart";

interface MealDatasheetProps {
  meal: Meal;
  targetMacros: MacroTargets;
  onClose: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

interface DailyValueRow {
  label: string;
  amount: number;
  unit: string;
  target: number;
}

function formatTag(tag: string): string {
  return tag
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function MealDatasheet({
  meal,
  targetMacros,
  onClose,
}: MealDatasheetProps) {
  const radarLabels = ["Calories", "Protein", "Carbs", "Fat", "Fiber", "Sugar"];
  const radarValues = [
    meal.calories,
    meal.protein,
    meal.carbs,
    meal.fat,
    meal.fiber ?? 0,
    meal.sugar ?? 0,
  ];
  const radarTargets = [
    targetMacros.calories,
    targetMacros.protein,
    targetMacros.carbs,
    targetMacros.fat,
    28, // RDV for fiber
    50, // RDV for sugar
  ];

  const dailyValues: DailyValueRow[] = [
    {
      label: "Calories",
      amount: meal.calories,
      unit: "kcal",
      target: targetMacros.calories,
    },
    {
      label: "Protein",
      amount: meal.protein,
      unit: "g",
      target: targetMacros.protein,
    },
    {
      label: "Carbs",
      amount: meal.carbs,
      unit: "g",
      target: targetMacros.carbs,
    },
    { label: "Fat", amount: meal.fat, unit: "g", target: targetMacros.fat },
    { label: "Fiber", amount: meal.fiber ?? 0, unit: "g", target: 28 },
    { label: "Sugar", amount: meal.sugar ?? 0, unit: "g", target: 50 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {meal.image_url ? (
              <img
                src={meal.image_url}
                alt={meal.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <span className="text-3xl">
                {CATEGORY_EMOJI[meal.category] ?? "🍽️"}
              </span>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{meal.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                  {meal.category}
                </span>
                <span className="text-xs text-gray-400">
                  {meal.serving_size}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600">{meal.description}</p>

        {/* Radar chart */}
        <RadarChart
          values={radarValues}
          targets={radarTargets}
          labels={radarLabels}
        />

        {/* % Daily Values */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            % Daily Values
          </h3>
          <div className="divide-y divide-gray-100">
            {dailyValues.map((row) => {
              const pct = Math.round((row.amount / row.target) * 100);
              return (
                <div
                  key={row.label}
                  className="flex justify-between py-1.5 text-sm"
                >
                  <span className="text-gray-700">{row.label}</span>
                  <span className="text-gray-900 font-medium">
                    {Math.round(row.amount)}
                    {row.unit}{" "}
                    <span className="text-gray-400 font-normal">
                      ({pct}%)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Allergen badges */}
        {meal.allergens.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Allergens
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {meal.allergens.map((a) => (
                <span
                  key={a}
                  className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-medium"
                >
                  {formatTag(a)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dietary tag badges */}
        {meal.dietary_tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Dietary Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {meal.dietary_tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium"
                >
                  {formatTag(t)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nutritional benefits */}
        {meal.nutritional_benefits && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Nutritional Benefits
            </h3>
            <p className="text-sm text-gray-600">
              {meal.nutritional_benefits}
            </p>
          </div>
        )}

        {/* Price + Close */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Price</div>
            <div className="text-xl font-bold text-gray-900">
              ฿{meal.price}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
