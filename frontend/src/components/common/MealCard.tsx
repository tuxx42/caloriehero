import type { Meal } from "../../api/types";

interface MealCardProps {
  meal: Meal;
  onSelect?: (meal: Meal) => void;
  onAddToCart?: (meal: Meal) => void;
  onInfo?: (meal: Meal) => void;
  score?: number;
}

export function MealCard({ meal, onSelect, onAddToCart, onInfo, score }: MealCardProps) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(meal)}
    >
      {meal.image_url && (
        <img
          src={meal.image_url}
          alt={meal.name}
          className="w-full h-40 object-cover"
        />
      )}
      {!meal.image_url && (
        <div className="w-full h-40 bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
          <span className="text-4xl">
            {meal.category === "breakfast"
              ? "🌅"
              : meal.category === "lunch"
                ? "☀️"
                : meal.category === "dinner"
                  ? "🌙"
                  : "🍎"}
          </span>
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
            {meal.name}
          </h3>
          {score !== undefined && (
            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full shrink-0">
              {Math.round(score * 100)}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {meal.description}
        </p>
        <div className="grid grid-cols-4 gap-1 text-center text-xs mb-3">
          <div>
            <div className="font-semibold text-gray-900">{Math.round(meal.calories)}</div>
            <div className="text-gray-400">cal</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{Math.round(meal.protein)}g</div>
            <div className="text-gray-400">pro</div>
          </div>
          <div>
            <div className="font-semibold text-amber-600">{Math.round(meal.carbs)}g</div>
            <div className="text-gray-400">carb</div>
          </div>
          <div>
            <div className="font-semibold text-rose-600">{Math.round(meal.fat)}g</div>
            <div className="text-gray-400">fat</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-900">฿{meal.price}</span>
          <div className="flex items-center gap-1.5">
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo(meal);
                }}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
              >
                Info
              </button>
            )}
            {onAddToCart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(meal);
                }}
                className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
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
