import { useRef, useState } from "react";
import type { DailyPlan, MultiDayPlan } from "../../api/types";
import type { BodyStats } from "../../utils/tdee";
import { calculateWeightProjection } from "../../utils/weightProjection";
import { WeightProjectionCard } from "../common/WeightProjectionCard";
import { NutritionLabel } from "../common/NutritionLabel";
import { AllergenBadge } from "../common/AllergenBadge";
import { RadarChart } from "../common/RadarChart";
import { svgToDataUrl } from "../../utils/svgToImage";
import { generatePlanPdf } from "../../utils/planPdf";
import {
  ChartIcon,
  CloseIcon,
  DownloadIcon,
  SLOT_ICONS,
  SunriseIcon,
} from "../icons/Icons";

interface PlanDatasheetProps {
  plan: DailyPlan;
  onClose?: () => void;
  bodyStats?: BodyStats;
  numDays?: number;
  dailyCalories?: number;
  /** Render inline (no modal overlay) when true */
  inline?: boolean;
  /** Pass the full multi-day plan for PDF generation */
  multiDayPlan?: MultiDayPlan;
}

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

function formatExtra(value: number, label: string): string | null {
  if (value === 0) return null;
  return `${value > 0 ? "+" : ""}${value}g ${label}`;
}

function SlotIcon({ slot, className }: { slot: string; className?: string }) {
  const IconComp = SLOT_ICONS[slot] ?? SunriseIcon;
  return <IconComp className={className} />;
}

export function PlanDatasheet({ plan, onClose, bodyStats, numDays, dailyCalories, inline, multiDayPlan }: PlanDatasheetProps) {
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
      await generatePlanPdf({ plan, multiDayPlan, radarChartDataUrl });
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

  // Format date
  const formattedDate = (() => {
    try {
      return new Date(plan.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return plan.date;
    }
  })();

  const content = (
    <>
      {/* Plan date */}
      <div className="text-xs text-gray-500">{formattedDate}</div>

      {/* Meal Schedule Table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Meal Schedule
        </h3>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-xs" data-testid="meal-schedule-table">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-2 text-gray-500 font-medium">Meal</th>
                <th className="text-left py-2 px-1 text-gray-500 font-medium">Item</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">Cal</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">Pro</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">Carb</th>
                <th className="text-right py-2 pl-1 text-gray-500 font-medium">Fat</th>
              </tr>
            </thead>
            <tbody>
              {plan.items.map((item) => {
                const extras = [
                  formatExtra(item.extra_protein, "P"),
                  formatExtra(item.extra_carbs, "C"),
                  formatExtra(item.extra_fat, "F"),
                ].filter(Boolean);

                return (
                  <tr key={item.slot} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-1.5">
                        <SlotIcon slot={item.slot} className="w-4 h-4 text-gray-500" />
                        <span className="capitalize text-gray-700 font-medium">{item.slot}</span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-gray-700">
                      <div>{item.meal_name}</div>
                      {extras.length > 0 && (
                        <div className="text-[10px] text-indigo-500">{extras.join(", ")}</div>
                      )}
                      <div className="text-[10px] text-gray-400">
                        {item.meal.serving_size} &middot; {Math.round(item.score * 100)}% match
                      </div>
                    </td>
                    <td className="text-right py-2 px-1 text-gray-900 font-medium">
                      {Math.round(item.meal.calories)}
                    </td>
                    <td className="text-right py-2 px-1 text-blue-600 font-medium">
                      {Math.round(item.meal.protein)}g
                    </td>
                    <td className="text-right py-2 px-1 text-amber-600 font-medium">
                      {Math.round(item.meal.carbs)}g
                    </td>
                    <td className="text-right py-2 pl-1 text-rose-600 font-medium">
                      {Math.round(item.meal.fat)}g
                    </td>
                  </tr>
                );
              })}

              {/* Totals row */}
              <tr className="border-t-2 border-gray-300 font-bold">
                <td className="py-2 pr-2 text-gray-900" colSpan={2}>TOTAL</td>
                <td className={`text-right py-2 px-1 ${pctColor(Math.round((actual.calories / target.calories) * 100))}`}>
                  {Math.round(actual.calories)}
                </td>
                <td className={`text-right py-2 px-1 ${pctColor(Math.round((actual.protein / target.protein) * 100))}`}>
                  {Math.round(actual.protein)}g
                </td>
                <td className={`text-right py-2 px-1 ${pctColor(Math.round((actual.carbs / target.carbs) * 100))}`}>
                  {Math.round(actual.carbs)}g
                </td>
                <td className={`text-right py-2 pl-1 ${pctColor(Math.round((actual.fat / target.fat) * 100))}`}>
                  {Math.round(actual.fat)}g
                </td>
              </tr>

              {/* Target row */}
              <tr className="text-gray-400">
                <td className="py-1 pr-2" colSpan={2}>TARGET</td>
                <td className="text-right py-1 px-1">{Math.round(target.calories)}</td>
                <td className="text-right py-1 px-1">{Math.round(target.protein)}g</td>
                <td className="text-right py-1 px-1">{Math.round(target.carbs)}g</td>
                <td className="text-right py-1 pl-1">{Math.round(target.fat)}g</td>
              </tr>
            </tbody>
          </table>
        </div>
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

        {/* Weight Projection */}
        {bodyStats && numDays && dailyCalories && (
          <WeightProjectionCard
            projection={calculateWeightProjection(bodyStats, dailyCalories, numDays)}
            currentWeight={bodyStats.weight}
          />
        )}

        {/* FDA Nutrition Label */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Nutrition Facts
          </h3>
          <div className="flex justify-center">
            <NutritionLabel
              calories={actual.calories}
              protein={actual.protein}
              carbs={actual.carbs}
              fat={actual.fat}
              fiber={totalFiber}
              sugar={totalSugar}
              targets={{
                calories: target.calories,
                protein: target.protein,
                carbs: target.carbs,
                fat: target.fat,
                fiber: FIBER_RDV,
                sugar: SUGAR_RDV,
              }}
            />
          </div>
        </div>

        {/* Calorie contribution bar */}
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
                <AllergenBadge key={allergen} allergen={allergen} slots={slots} />
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

      {/* Total price + PDF */}
      <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Total Price</div>
          <div className="text-xl font-bold text-gray-900">
            ฿{totalPrice.toFixed(0)}
          </div>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <DownloadIcon className="w-4 h-4" />
          {downloading ? "Generating..." : "Download PDF"}
        </button>
      </div>
    </>
  );

  if (inline) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <ChartIcon className="w-8 h-8 text-emerald-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daily Plan</h2>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                {Math.round(plan.total_score * 100)}% match
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        {content}
        <div className="flex justify-end">
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
