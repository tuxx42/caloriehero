import type { WeightProjection } from "../../utils/weightProjection";
import { TrendUpIcon, TrendDownIcon, ScaleIcon } from "../icons/Icons";

interface WeightProjectionCardProps {
  projection: WeightProjection;
  currentWeight: number;
}

export function WeightProjectionCard({
  projection,
  currentWeight,
}: WeightProjectionCardProps) {
  const { weightChangeKg, tdee, dailyCalories, dailySurplus, numDays } =
    projection;
  const projectedWeight = currentWeight + weightChangeKg;

  // Color scheme: blue for gain, amber for loss, emerald for maintenance
  const isGain = weightChangeKg > 0.05;
  const isLoss = weightChangeKg < -0.05;

  const colorScheme = isGain
    ? { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-700" }
    : isLoss
      ? { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100 text-amber-700" }
      : { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", badge: "bg-emerald-100 text-emerald-700" };

  const label = isGain ? "Weight Gain" : isLoss ? "Weight Loss" : "Maintenance";
  const sign = weightChangeKg >= 0 ? "+" : "";

  return (
    <div
      className={`${colorScheme.bg} ${colorScheme.border} border rounded-xl p-4 space-y-3`}
      data-testid="weight-projection-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isGain
            ? <TrendUpIcon className={`w-5 h-5 ${colorScheme.text}`} />
            : isLoss
              ? <TrendDownIcon className={`w-5 h-5 ${colorScheme.text}`} />
              : <ScaleIcon className={`w-5 h-5 ${colorScheme.text}`} />
          }
          <span className={`text-sm font-semibold ${colorScheme.text}`}>
            {numDays}-Day Projection
          </span>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorScheme.badge}`}>
          {label}
        </span>
      </div>

      <div className="text-center">
        <div className={`text-2xl font-bold ${colorScheme.text}`}>
          {sign}{weightChangeKg.toFixed(2)} kg
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {currentWeight.toFixed(1)} kg → {projectedWeight.toFixed(1)} kg
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white/60 rounded-lg p-2">
          <div className="text-gray-500">TDEE</div>
          <div className="font-semibold text-gray-900">{Math.round(tdee)} kcal</div>
        </div>
        <div className="bg-white/60 rounded-lg p-2">
          <div className="text-gray-500">Plan Avg</div>
          <div className="font-semibold text-gray-900">{Math.round(dailyCalories)} kcal</div>
        </div>
        <div className="bg-white/60 rounded-lg p-2">
          <div className="text-gray-500">{dailySurplus >= 0 ? "Surplus" : "Deficit"}</div>
          <div className={`font-semibold ${colorScheme.text}`}>
            {dailySurplus >= 0 ? "+" : ""}{Math.round(dailySurplus)} kcal
          </div>
        </div>
      </div>
    </div>
  );
}
