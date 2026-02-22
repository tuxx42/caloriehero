import type { PlanContext } from "../../stores/cart";

interface PlanSummaryBadgeProps {
  planContexts: PlanContext[];
}

export function PlanSummaryBadge({ planContexts }: PlanSummaryBadgeProps) {
  return (
    <div className="space-y-2" data-testid="plan-summary-badge">
      {planContexts.map((ctx, i) => {
        const avgCalories =
          ctx.dailySummaries.reduce((s, d) => s + d.actual_macros.calories, 0) /
          ctx.dailySummaries.length;
        const matchPct = Math.round(ctx.totalScore * 100);

        return (
          <div
            key={i}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
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
              <div className="text-right text-xs text-emerald-700">
                <div className="font-medium">
                  Avg {Math.round(avgCalories)} kcal/day
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
