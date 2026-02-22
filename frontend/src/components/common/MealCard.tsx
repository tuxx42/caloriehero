import type { Meal } from "../../api/types";
import { SLOT_ICONS, SunriseIcon, FlameIcon, InfoIcon } from "../icons/Icons";
import { CATEGORY_FALLBACKS } from "../../utils/images";

interface MealCardProps {
  meal: Meal;
  onSelect?: (meal: Meal) => void;
  onAddToCart?: (meal: Meal) => void;
  onInfo?: (meal: Meal) => void;
  score?: number;
}

export function MealCard({ meal, onSelect, onAddToCart, onInfo, score }: MealCardProps) {
  const imageSrc = meal.image_url || CATEGORY_FALLBACKS[meal.category];
  const SlotIconComp = SLOT_ICONS[meal.category] ?? SunriseIcon;

  return (
    <div
      className="group bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 border border-stone-100"
      onClick={() => onSelect?.(meal)}
    >
      <div className="relative overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={meal.name}
            className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
            <SlotIconComp className="w-12 h-12 text-emerald-300" />
          </div>
        )}
        {score !== undefined && (
          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold rounded-full shadow-sm">
            {Math.round(score * 100)}%
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 text-sm leading-tight mb-1">
          {meal.name}
        </h3>
        <p className="text-xs text-stone-500 mb-3 line-clamp-2">
          {meal.description}
        </p>
        <div className="grid grid-cols-4 gap-1 text-center text-xs mb-3">
          <div>
            <div className="flex items-center justify-center gap-0.5">
              <FlameIcon className="w-3 h-3 text-stone-400" />
              <span className="font-semibold text-stone-900">{Math.round(meal.calories)}</span>
            </div>
            <div className="text-stone-400">cal</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{Math.round(meal.protein)}g</div>
            <div className="text-stone-400">pro</div>
          </div>
          <div>
            <div className="font-semibold text-amber-600">{Math.round(meal.carbs)}g</div>
            <div className="text-stone-400">carb</div>
          </div>
          <div>
            <div className="font-semibold text-rose-600">{Math.round(meal.fat)}g</div>
            <div className="text-stone-400">fat</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-stone-900">฿{meal.price}</span>
          <div className="flex items-center gap-1.5">
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo(meal);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
              >
                <InfoIcon className="w-3.5 h-3.5" />
                Info
              </button>
            )}
            {onAddToCart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(meal);
                }}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
