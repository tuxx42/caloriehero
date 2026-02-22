import { useRef, useState } from "react";
import type { DailyPlan } from "../../api/types";
import { RadarChart } from "../common/RadarChart";
import { svgToDataUrl } from "../../utils/svgToImage";
import { generatePlanPdf } from "../../utils/planPdf";

interface PlanDatasheetProps {
  plan: DailyPlan;
  onClose: () => void;
}

const SLOT_EMOJI: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

const SLOT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  breakfast: { bg: "bg-emerald-100", text: "text-emerald-700", bar: "bg-emerald-500" },
  lunch: { bg: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-500" },
  dinner: { bg: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-500" },
  snack: { bg: "bg-rose-100", text: "text-rose-700", bar: "bg-rose-500" },
};

const FIBER_RDV = 28;
const SUGAR_RDV = 50;

function formatTag(tag: string): string {
  return tag
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pctColor(pct: number): string {
  if (pct >= 90) return "text-emerald-600";
  if (pct >= 70) return "text-amber-600";
  return "text-red-500";
}

function deltaColor(delta: number): string {
  return delta >= 0 ? "text-emerald-600" : "text-red-500";
}

function formatDelta(delta: number, unit: string): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${Math.round(delta)}${unit}`;
}

export function PlanDatasheet({ plan, onClose }: PlanDatasheetProps) {
  const radarRef = useRef<SVGSVGElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { actual_macros: actual, target_macros: target } = plan;

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      let radarChartDataUrl: string | undefined;
      if (radarRef.current) {
        radarChartDataUrl = await svgToDataUrl(radarRef.current, 280, 280);
      }
      await generatePlanPdf({ plan, radarChartDataUrl });
    } finally {
      setDownloading(false);
    }
  }

  // Aggregate fiber/sugar from all meals
  const totalFiber = plan.items.reduce((s, i) => s + (i.meal.fiber ?? 0), 0);
  const totalSugar = plan.items.reduce((s, i) => s + (i.meal.sugar ?? 0), 0);

  // Radar chart data
  const radarLabels = ["Calories", "Protein", "Carbs", "Fat", "Fiber", "Sugar"];
  const radarValues = [
    actual.calories,
    actual.protein,
    actual.carbs,
    actual.fat,
    totalFiber,
    totalSugar,
  ];
  const radarTargets = [
    target.calories,
    target.protein,
    target.carbs,
    target.fat,
    FIBER_RDV,
    SUGAR_RDV,
  ];

  // Macro split (calorie contribution)
  const proteinCal = actual.protein * 4;
  const carbsCal = actual.carbs * 4;
  const fatCal = actual.fat * 9;
  const totalMacroCal = proteinCal + carbsCal + fatCal;
  const proteinPct = totalMacroCal > 0 ? Math.round((proteinCal / totalMacroCal) * 100) : 0;
  const fatPct = totalMacroCal > 0 ? Math.round((fatCal / totalMacroCal) * 100) : 0;
  const carbsPct = 100 - proteinPct - fatPct;

  // Calorie gap
  const calorieDelta = actual.calories - target.calories;

  // Daily values rows
  const dailyValues = [
    { label: "Calories", actual: actual.calories, unit: "kcal", target: target.calories },
    { label: "Protein", actual: actual.protein, unit: "g", target: target.protein },
    { label: "Carbs", actual: actual.carbs, unit: "g", target: target.carbs },
    { label: "Fat", actual: actual.fat, unit: "g", target: target.fat },
    { label: "Fiber", actual: totalFiber, unit: "g", target: FIBER_RDV },
    { label: "Sugar", actual: totalSugar, unit: "g", target: SUGAR_RDV },
  ];

  // Nutrition specs per meal
  const nutrients = [
    { key: "calories", label: "Calories", unit: "kcal", target: target.calories },
    { key: "protein", label: "Protein", unit: "g", target: target.protein },
    { key: "carbs", label: "Carbs", unit: "g", target: target.carbs },
    { key: "fat", label: "Fat", unit: "g", target: target.fat },
    { key: "fiber", label: "Fiber", unit: "g", target: FIBER_RDV },
    { key: "sugar", label: "Sugar", unit: "g", target: SUGAR_RDV },
  ] as const;

  // Meal calorie contribution
  const totalCal = actual.calories || 1;
  const mealCalShares = plan.items.map((item) => ({
    slot: item.slot,
    name: item.meal_name,
    pct: Math.round((item.meal.calories / totalCal) * 100),
  }));

  // Combined allergens with meal attribution
  const allergenMap = new Map<string, string[]>();
  for (const item of plan.items) {
    for (const a of item.meal.allergens) {
      const existing = allergenMap.get(a) ?? [];
      if (!existing.includes(item.slot)) {
        existing.push(item.slot);
      }
      allergenMap.set(a, existing);
    }
  }

  // Combined dietary tags (deduplicated)
  const dietaryTags = [
    ...new Set(plan.items.flatMap((item) => item.meal.dietary_tags)),
  ];

  // Total price
  const totalPrice =
    plan.items.reduce((sum, item) => sum + item.meal.price, 0) +
    plan.total_extra_price;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daily Plan</h2>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                {Math.round(plan.total_score * 100)}% match
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Radar chart */}
        <RadarChart
          ref={radarRef}
          values={radarValues}
          targets={radarTargets}
          labels={radarLabels}
        />

        {/* Macro split bar */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Macro Split
          </h3>
          <div className="flex h-6 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 flex items-center justify-center"
              style={{ width: `${proteinPct}%` }}
            >
              {proteinPct >= 10 && (
                <span className="text-[10px] font-semibold text-white">
                  {proteinPct}% P
                </span>
              )}
            </div>
            <div
              className="bg-amber-500 flex items-center justify-center"
              style={{ width: `${carbsPct}%` }}
            >
              {carbsPct >= 10 && (
                <span className="text-[10px] font-semibold text-white">
                  {carbsPct}% C
                </span>
              )}
            </div>
            <div
              className="bg-rose-500 flex items-center justify-center"
              style={{ width: `${fatPct}%` }}
            >
              {fatPct >= 10 && (
                <span className="text-[10px] font-semibold text-white">
                  {fatPct}% F
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {proteinPct}% P / {carbsPct}% C / {fatPct}% F
          </p>
        </div>

        {/* Calorie & macro gap */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Calorie &amp; Macro Gap
          </h3>
          <div
            className={`text-center text-lg font-bold mb-2 ${deltaColor(calorieDelta)}`}
          >
            {formatDelta(calorieDelta, " kcal")}{" "}
            <span className="text-sm font-normal text-gray-500">
              {calorieDelta >= 0 ? "over target" : "under target"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Protein", actual: actual.protein, target: target.protein, unit: "g" },
              { label: "Carbs", actual: actual.carbs, target: target.carbs, unit: "g" },
              { label: "Fat", actual: actual.fat, target: target.fat, unit: "g" },
              { label: "Fiber", actual: totalFiber, target: FIBER_RDV, unit: "g" },
            ].map((row) => {
              const delta = row.actual - row.target;
              return (
                <div
                  key={row.label}
                  className="flex justify-between text-sm px-2 py-1 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-600">{row.label}</span>
                  <span className={`font-medium ${deltaColor(delta)}`}>
                    {formatDelta(delta, row.unit)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* % Daily Values */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            % Daily Values
          </h3>
          <div className="divide-y divide-gray-100">
            {dailyValues.map((row) => {
              const pct = Math.round((row.actual / row.target) * 100);
              return (
                <div
                  key={row.label}
                  className="flex justify-between py-1.5 text-sm"
                >
                  <span className="text-gray-700">{row.label}</span>
                  <span className="text-gray-900 font-medium">
                    {Math.round(row.actual)}
                    {row.unit}{" "}
                    <span className={`font-normal ${pctColor(pct)}`}>
                      ({pct}%)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nutrition specs table */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Nutrition Breakdown
          </h3>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-xs" data-testid="nutrition-table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-2 text-gray-500 font-medium sticky left-0 bg-white">
                    &nbsp;
                  </th>
                  {plan.items.map((item) => (
                    <th
                      key={item.slot}
                      className="text-right py-2 px-1 text-gray-500 font-medium whitespace-nowrap"
                    >
                      {SLOT_EMOJI[item.slot] ?? "🍽️"}{" "}
                      {item.meal_name.length > 10
                        ? item.meal_name.slice(0, 10) + "…"
                        : item.meal_name}
                    </th>
                  ))}
                  <th className="text-right py-2 px-1 text-gray-900 font-bold">
                    Total
                  </th>
                  <th className="text-right py-2 px-1 text-gray-500 font-medium">
                    Target
                  </th>
                  <th className="text-right py-2 pl-1 text-gray-500 font-medium">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {nutrients.map((nut) => {
                  const perMeal = plan.items.map((item) => {
                    const val = item.meal[nut.key];
                    return val ?? 0;
                  });
                  const total = nut.key === "calories"
                    ? actual.calories
                    : nut.key === "protein"
                      ? actual.protein
                      : nut.key === "carbs"
                        ? actual.carbs
                        : nut.key === "fat"
                          ? actual.fat
                          : nut.key === "fiber"
                            ? totalFiber
                            : totalSugar;
                  const pct = Math.round((total / nut.target) * 100);

                  return (
                    <tr key={nut.key} className="border-b border-gray-50">
                      <td className="py-1.5 pr-2 text-gray-700 font-medium sticky left-0 bg-white">
                        {nut.label}
                      </td>
                      {perMeal.map((val, i) => (
                        <td
                          key={plan.items[i].slot}
                          className="text-right py-1.5 px-1 text-gray-600"
                        >
                          {Math.round(val)}
                          {nut.unit === "kcal" ? "" : nut.unit}
                        </td>
                      ))}
                      <td className="text-right py-1.5 px-1 text-gray-900 font-bold">
                        {Math.round(total)}
                        {nut.unit === "kcal" ? "" : nut.unit}
                      </td>
                      <td className="text-right py-1.5 px-1 text-gray-500">
                        {Math.round(nut.target)}
                        {nut.unit === "kcal" ? "" : nut.unit}
                      </td>
                      <td
                        className={`text-right py-1.5 pl-1 font-medium ${pctColor(pct)}`}
                      >
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Meal calorie contribution bar */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Calorie Contribution
          </h3>
          <div className="flex h-5 rounded-full overflow-hidden">
            {mealCalShares.map((share) => {
              const colors = SLOT_COLORS[share.slot] ?? SLOT_COLORS.snack;
              return (
                <div
                  key={share.slot}
                  className={`${colors.bar} flex items-center justify-center`}
                  style={{ width: `${share.pct}%` }}
                >
                  {share.pct >= 12 && (
                    <span className="text-[9px] font-semibold text-white">
                      {share.pct}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-600">
            {mealCalShares.map((share) => {
              const colors = SLOT_COLORS[share.slot] ?? SLOT_COLORS.snack;
              return (
                <span key={share.slot} className="flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${colors.bar}`}
                  />
                  <span className="capitalize">{share.slot}</span> {share.pct}%
                </span>
              );
            })}
          </div>
        </div>

        {/* Combined allergens */}
        {allergenMap.size > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Allergens
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[...allergenMap.entries()].map(([allergen, slots]) => (
                <span
                  key={allergen}
                  className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-medium"
                >
                  {formatTag(allergen)}{" "}
                  <span className="text-red-400 font-normal">
                    ({slots.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")})
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Combined dietary tags */}
        {dietaryTags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Dietary Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {dietaryTags.map((t) => (
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

        {/* Total price + Close */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Total Price</div>
            <div className="text-xl font-bold text-gray-900">
              ฿{totalPrice.toFixed(0)}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
