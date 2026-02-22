import type { Meal, MacroTargets } from "../../api/types";
import { RadarChart } from "../common/RadarChart";
import { NutritionLabel } from "../common/NutritionLabel";
import { AllergenBadge } from "../common/AllergenBadge";
import { CloseIcon, SLOT_ICONS, SunriseIcon } from "../icons/Icons";

interface MealDatasheetProps {
  meal: Meal;
  targetMacros: MacroTargets;
  onClose: () => void;
}

const FIBER_RDV = 28;
const SUGAR_RDV = 50;

function formatTag(tag: string): string {
  return tag
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function SlotIcon({ slot, className }: { slot: string; className?: string }) {
  const IconComp = SLOT_ICONS[slot] ?? SunriseIcon;
  return <IconComp className={className} />;
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
    FIBER_RDV,
    SUGAR_RDV,
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
              <SlotIcon slot={meal.category} className="w-10 h-10 text-gray-400" />
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
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600">{meal.description}</p>

        {/* Radar chart */}
        <RadarChart
          values={radarValues}
          targets={radarTargets}
          labels={radarLabels}
        />

        {/* FDA Nutrition Label */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Nutrition Facts
          </h3>
          <div className="flex justify-center">
            <NutritionLabel
              calories={meal.calories}
              protein={meal.protein}
              carbs={meal.carbs}
              fat={meal.fat}
              fiber={meal.fiber ?? undefined}
              sugar={meal.sugar ?? undefined}
              servingSize={meal.serving_size}
              targets={{
                calories: targetMacros.calories,
                protein: targetMacros.protein,
                carbs: targetMacros.carbs,
                fat: targetMacros.fat,
                fiber: FIBER_RDV,
                sugar: SUGAR_RDV,
              }}
            />
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
                <AllergenBadge key={a} allergen={a} />
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
