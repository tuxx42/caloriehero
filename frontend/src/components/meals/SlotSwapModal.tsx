import { useEffect, useState } from "react";
import { getSlotAlternatives } from "../../api/endpoints/matching";
import type { SlotAlternative } from "../../api/types";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface SlotSwapModalProps {
  slot: string;
  currentMealId: string;
  planMealIds: string[];
  onSwap: (slot: string, newMealId: string) => void;
  onClose: () => void;
}

export function SlotSwapModal({
  slot,
  currentMealId,
  planMealIds,
  onSwap,
  onClose,
}: SlotSwapModalProps) {
  const [alternatives, setAlternatives] = useState<SlotAlternative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSlotAlternatives(slot, planMealIds)
      .then((data) => {
        if (!cancelled) setAlternatives(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load alternatives",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slot, currentMealId, planMealIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-900 capitalize">
              Swap {slot}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose an alternative meal
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {loading && <LoadingSpinner />}

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!loading && !error && alternatives.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No alternatives available
          </p>
        )}

        {!loading && !error && alternatives.length > 0 && (
          <div className="space-y-2">
            {alternatives.map((alt) => (
              <button
                key={alt.meal_id}
                onClick={() => onSwap(slot, alt.meal_id)}
                className="w-full text-left bg-gray-50 hover:bg-emerald-50 rounded-xl p-3 transition-colors border border-transparent hover:border-emerald-200"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 text-sm">
                    {alt.meal_name}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium">
                    {Math.round(alt.score * 100)}% match
                  </span>
                </div>
                {alt.meal && (
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(alt.meal.calories)} cal ·{" "}
                    {Math.round(alt.meal.protein)}g P ·{" "}
                    {Math.round(alt.meal.carbs)}g C ·{" "}
                    {Math.round(alt.meal.fat)}g F · ฿{alt.meal.price}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
