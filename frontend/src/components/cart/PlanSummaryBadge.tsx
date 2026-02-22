import type { PlanContext } from "../../stores/cart";
import { ClipboardIcon, CloseIcon } from "../icons/Icons";

interface PlanSummaryBadgeProps {
  planContexts: PlanContext[];
  onRemove?: (planId: string) => void;
}

export function PlanSummaryBadge({ planContexts, onRemove }: PlanSummaryBadgeProps) {
  return (
    <div className="space-y-2" data-testid="plan-summary-badge">
      {planContexts.map((ctx) => {
        const avgCalories =
          ctx.dailySummaries.reduce((s, d) => s + d.actual_macros.calories, 0) /
          ctx.dailySummaries.length;
        const matchPct = Math.round(ctx.totalScore * 100);

        return (
          <div
            key={ctx.id}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardIcon className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-sm font-semibold text-emerald-800">
                    {ctx.numDays === 1
                      ? "Daily Plan"
                      : `${ctx.numDays}-Day Plan`}
                  </span>
                  <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    {matchPct}% match
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right text-xs text-emerald-700">
                  <div className="font-medium">
                    Avg {Math.round(avgCalories)} kcal/day
                  </div>
                </div>
                {onRemove && (
                  <button
                    onClick={() => onRemove(ctx.id)}
                    className="text-emerald-400 hover:text-red-500 transition-colors ml-1"
                    aria-label={`Remove ${ctx.numDays === 1 ? "daily" : `${ctx.numDays}-day`} plan`}
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
