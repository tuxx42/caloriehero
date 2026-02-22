import { useState } from "react";
import { useNavigate } from "react-router";
import {
  generateMultiDayPlan,
  recalculatePlan,
} from "../api/endpoints/matching";
import type { DailyPlan, MultiDayPlan, PlanItem } from "../api/types";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MacroBar } from "../components/common/MacroBar";
import { NutritionLabel } from "../components/common/NutritionLabel";
import { DayTabBar } from "../components/meals/DayTabBar";
import { MealDatasheet } from "../components/meals/MealDatasheet";
import { PlanDatasheet } from "../components/meals/PlanDatasheet";
import { SlotSwapModal } from "../components/meals/SlotSwapModal";
import { useCartStore, type PlanContext } from "../stores/cart";
import { useProfileStore } from "../stores/profile";
import type { BodyStats } from "../utils/tdee";
import { generatePlanPdf } from "../utils/planPdf";
import { SLOT_ICONS, SunriseIcon, InfoIcon, SwapIcon, FlameIcon, ProteinIcon, GrainIcon, DropletIcon, DownloadIcon } from "../components/icons/Icons";
import { CATEGORY_FALLBACKS } from "../utils/images";

function formatExtra(value: number, label: string): string | null {
  if (value === 0) return null;
  return `${value > 0 ? "+" : ""}${value}g ${label}`;
}

/** Per-slot card with optional inline nutrition tab */
function SlotCard({
  item,
  isRepeated,
  onDetail,
  onSwap,
  swapping,
}: {
  item: PlanItem;
  isRepeated: boolean;
  onDetail: () => void;
  onSwap: () => void;
  swapping: boolean;
}) {
  const [showNutrition, setShowNutrition] = useState(false);

  const extras = [
    formatExtra(item.extra_protein, "P"),
    formatExtra(item.extra_carbs, "C"),
    formatExtra(item.extra_fat, "F"),
  ].filter(Boolean);

  const SlotIconComp = SLOT_ICONS[item.slot] ?? SunriseIcon;
  const thumbSrc = item.meal?.image_url || CATEGORY_FALLBACKS[item.slot];

  return (
    <div className="bg-white rounded-2xl shadow-card border border-stone-100 overflow-hidden transition-all duration-200">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={item.meal_name}
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <SlotIconComp className="w-6 h-6 text-emerald-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900 capitalize text-sm">
                  {item.slot}
                </h3>
                {isRepeated && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                    Repeated
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-emerald-600 font-semibold">
                  {Math.round(item.score * 100)}%
                </span>
                <button
                  onClick={onDetail}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <InfoIcon className="w-3 h-3" />
                  Details
                </button>
                <button
                  onClick={onSwap}
                  disabled={swapping}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 disabled:opacity-50 transition-colors"
                >
                  <SwapIcon className="w-3 h-3" />
                  Swap
                </button>
              </div>
            </div>
            <p className="text-sm text-stone-700 font-medium">{item.meal_name}</p>
            {extras.length > 0 && (
              <p className="text-xs text-indigo-600 mt-0.5">{extras.join(", ")}</p>
            )}
            {item.extra_price > 0 && (
              <p className="text-xs text-stone-500 mt-0.5">
                Extra: ฿{item.extra_price.toFixed(0)}
              </p>
            )}
          </div>
        </div>

        {/* Compact macro row */}
        <div className="grid grid-cols-4 gap-1 text-center text-xs">
          <div>
            <div className="font-semibold">{Math.round(item.slot_targets.calories)}</div>
            <div className="text-stone-400">cal</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{Math.round(item.slot_targets.protein)}g</div>
            <div className="text-stone-400">pro</div>
          </div>
          <div>
            <div className="font-semibold text-amber-600">{Math.round(item.slot_targets.carbs)}g</div>
            <div className="text-stone-400">carb</div>
          </div>
          <div>
            <div className="font-semibold text-rose-600">{Math.round(item.slot_targets.fat)}g</div>
            <div className="text-stone-400">fat</div>
          </div>
        </div>
      </div>

      {/* Nutrition toggle */}
      <div className="border-t border-stone-100">
        <button
          onClick={() => setShowNutrition(!showNutrition)}
          className="w-full px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 hover:text-emerald-600 hover:bg-emerald-50/50 transition-colors"
        >
          <FlameIcon className="w-3.5 h-3.5" />
          {showNutrition ? "Hide Nutrition" : "Nutrition"}
          <svg className={`w-3 h-3 transition-transform duration-200 ${showNutrition ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Inline nutrition panel */}
      {showNutrition && item.meal && (
        <div className="border-t border-stone-100 px-4 py-4 bg-stone-50/50 animate-slide-up space-y-4">
          {/* Macro detail bars */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-stone-700">
              <ProteinIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium w-10">Protein</span>
              <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min((item.meal.protein / item.slot_targets.protein) * 100, 100)}%` }}
                />
              </div>
              <span className="font-semibold text-blue-600 w-10 text-right">{Math.round(item.meal.protein)}g</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-700">
              <GrainIcon className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium w-10">Carbs</span>
              <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min((item.meal.carbs / item.slot_targets.carbs) * 100, 100)}%` }}
                />
              </div>
              <span className="font-semibold text-amber-600 w-10 text-right">{Math.round(item.meal.carbs)}g</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-700">
              <DropletIcon className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-medium w-10">Fat</span>
              <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${Math.min((item.meal.fat / item.slot_targets.fat) * 100, 100)}%` }}
                />
              </div>
              <span className="font-semibold text-rose-600 w-10 text-right">{Math.round(item.meal.fat)}g</span>
            </div>
          </div>

          {/* FDA Nutrition Label */}
          <NutritionLabel
            calories={item.meal.calories}
            protein={item.meal.protein}
            carbs={item.meal.carbs}
            fat={item.meal.fat}
            fiber={item.meal.fiber ?? undefined}
            sugar={item.meal.sugar ?? undefined}
            servingSize={item.meal.serving_size}
            targets={item.slot_targets}
          />

          {/* Extra info */}
          {(item.meal.allergens.length > 0 || item.meal.dietary_tags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {item.meal.allergens.map((a) => (
                <span key={a} className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-medium rounded-full">
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </span>
              ))}
              {item.meal.dietary_tags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded-full">
                  {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PlanGeneratorPage() {
  const [multiDayPlan, setMultiDayPlan] = useState<MultiDayPlan | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [numDays, setNumDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapSlot, setSwapSlot] = useState<{
    slot: string;
    currentMealId: string;
  } | null>(null);
  const [detailItem, setDetailItem] = useState<PlanItem | null>(null);
  const [viewTab, setViewTab] = useState<"meals" | "nutrition">("meals");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const addPlanContext = useCartStore((s) => s.addPlanContext);
  const profile = useProfileStore((s) => s.profile);

  // Derive body stats from profile if available
  const bodyStats: BodyStats | undefined =
    profile?.weight_kg != null &&
    profile?.height_cm != null &&
    profile?.age != null &&
    profile?.gender != null &&
    profile?.activity_level != null
      ? {
          weight: profile.weight_kg,
          height: profile.height_cm,
          age: profile.age,
          gender: profile.gender as BodyStats["gender"],
          activityLevel: profile.activity_level as BodyStats["activityLevel"],
        }
      : undefined;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateMultiDayPlan(numDays);
      setMultiDayPlan(result);
      setActiveDay(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  // Get the currently displayed day from multi-day plan
  const activePlan: DailyPlan | null =
    multiDayPlan?.plans[activeDay - 1] ?? null;

  const activeDayRepeatedIds: Set<string> =
    multiDayPlan
      ? new Set(multiDayPlan.plans[activeDay - 1]?.repeated_meal_ids ?? [])
      : new Set();

  const handleSwap = async (slot: string, newMealId: string) => {
    if (!activePlan) return;
    setSwapSlot(null);
    setSwapping(true);
    try {
      const newItems = activePlan.items.map((item) =>
        item.slot === slot
          ? { slot, meal_id: newMealId }
          : { slot: item.slot, meal_id: item.meal_id },
      );
      const recalculated = await recalculatePlan(newItems);

      if (multiDayPlan) {
        const updatedPlans = [...multiDayPlan.plans];
        const dayPlan = updatedPlans[activeDay - 1];
        updatedPlans[activeDay - 1] = {
          ...recalculated,
          day: dayPlan.day,
          date: dayPlan.date,
          repeated_meal_ids: recomputeRepeats(updatedPlans, activeDay - 1),
        };
        setMultiDayPlan({ ...multiDayPlan, plans: updatedPlans });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to swap meal",
      );
    } finally {
      setSwapping(false);
    }
  };

  const handleAddPlanToCart = () => {
    if (!multiDayPlan) return;
    const planId = crypto.randomUUID();

    for (const dayPlan of multiDayPlan.plans) {
      for (const item of dayPlan.items) {
        addItem(item.meal, {
          extraProtein: item.extra_protein,
          extraCarbs: item.extra_carbs,
          extraFat: item.extra_fat,
        }, planId);
      }
    }
    const avgScore =
      multiDayPlan.plans.reduce((s, p) => s + p.total_score, 0) /
      multiDayPlan.plans.length;
    const ctx: PlanContext = {
      id: planId,
      planType: "multi",
      numDays: multiDayPlan.days,
      targetMacros: multiDayPlan.plans[0].target_macros,
      dailySummaries: multiDayPlan.plans.map((p) => ({
        day: p.day,
        target_macros: p.target_macros,
        actual_macros: p.actual_macros,
      })),
      totalScore: avgScore,
    };
    addPlanContext(ctx);
    navigate("/cart");
  };

  const handleDownloadPdf = async () => {
    if (!activePlan) return;
    setDownloadingPdf(true);
    try {
      await generatePlanPdf({
        plan: activePlan,
        multiDayPlan: multiDayPlan ?? undefined,
        userProfile: profile ?? undefined,
        bodyStats,
        numDays: multiDayPlan?.days,
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const planTotalPrice = multiDayPlan?.total_price ?? 0;

  const hasGenerated = multiDayPlan !== null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center animate-fade-in">
        <h1 className="font-display text-2xl text-stone-900 mb-1">
          {numDays}-Day Meal Plan
        </h1>
        <p className="text-sm text-stone-500">
          AI-matched meals to hit your macro targets
        </p>
      </div>

      {/* Day count slider */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="num-days" className="text-sm font-medium text-stone-700">
            Plan duration
          </label>
          <span className="text-sm font-bold text-emerald-600">{numDays} days</span>
        </div>
        <input
          id="num-days"
          type="range"
          min={5}
          max={30}
          value={numDays}
          onChange={(e) => setNumDays(Number(e.target.value))}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between text-xs text-stone-400 mt-1">
          <span>5 days</span>
          <span>30 days</span>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-all duration-200 shadow-sm"
      >
        {loading
          ? "Generating..."
          : hasGenerated
            ? "Regenerate Plan"
            : "Generate Plan"}
      </button>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Plan summary + repeat warning */}
      {multiDayPlan && !loading && (
        <>
          <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100 animate-slide-up">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-stone-900">
                {multiDayPlan.days}-Day Plan
              </h2>
              <span className="text-sm text-stone-500">
                {multiDayPlan.total_unique_meals} unique meals
              </span>
            </div>
            <div className="text-xs text-stone-400 mt-1">
              Avg {Math.round(
                multiDayPlan.plans.reduce((s, p) => s + p.total_score, 0) /
                  multiDayPlan.plans.length * 100
              )}% match
            </div>
          </div>

          {multiDayPlan.has_repeats && (
            <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm border border-amber-100">
              Some meals are repeated across days due to limited menu variety.
              Days with repeats are marked with an amber dot.
            </div>
          )}

          <DayTabBar
            plans={multiDayPlan.plans}
            activeDay={activeDay}
            onDayChange={setActiveDay}
          />
        </>
      )}

      {activePlan && !loading && (
        <>
          {/* Score header */}
          <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-stone-900">
                Day {activeDay} Overview
              </h2>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-full">
                {Math.round(activePlan.total_score * 100)}% match
              </span>
            </div>
          </div>

          {/* Meals / Nutrition tab bar */}
          <div className="flex bg-stone-100 rounded-xl p-1">
            <button
              onClick={() => setViewTab("meals")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewTab === "meals"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Meals
            </button>
            <button
              onClick={() => setViewTab("nutrition")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewTab === "nutrition"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Nutrition
            </button>
          </div>

          {viewTab === "meals" && (
            <>
              {/* Macro bars */}
              <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100 space-y-3 animate-slide-up">
                <MacroBar
                  label="Calories"
                  value={activePlan.actual_macros.calories}
                  target={activePlan.target_macros.calories}
                  unit="kcal"
                />
                <MacroBar
                  label="Protein"
                  value={activePlan.actual_macros.protein}
                  target={activePlan.target_macros.protein}
                  color="bg-blue-500"
                />
                <MacroBar
                  label="Carbs"
                  value={activePlan.actual_macros.carbs}
                  target={activePlan.target_macros.carbs}
                  color="bg-amber-500"
                />
                <MacroBar
                  label="Fat"
                  value={activePlan.actual_macros.fat}
                  target={activePlan.target_macros.fat}
                  color="bg-rose-500"
                />
              </div>

              {/* Slot cards with inline nutrition */}
              <div className="space-y-3">
                {activePlan.items.map((item, i) => (
                  <div key={item.slot} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <SlotCard
                      item={item}
                      isRepeated={activeDayRepeatedIds.has(item.meal_id)}
                      onDetail={() => setDetailItem(item)}
                      onSwap={() =>
                        setSwapSlot({
                          slot: item.slot,
                          currentMealId: item.meal_id,
                        })
                      }
                      swapping={swapping}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {viewTab === "nutrition" && (
            <PlanDatasheet
              plan={activePlan}
              inline
              bodyStats={bodyStats}
              numDays={multiDayPlan?.days}
              dailyCalories={activePlan.actual_macros.calories}
              multiDayPlan={multiDayPlan ?? undefined}
              userProfile={profile ?? undefined}
            />
          )}

          {/* Add Plan to Cart + Download PDF */}
          <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <span className="text-stone-600">Total plan price</span>
              <span className="text-xl font-bold text-stone-900">
                ฿{planTotalPrice.toFixed(0)}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddPlanToCart}
                className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-all duration-200 shadow-sm"
              >
                Add Plan to Cart
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-2 px-4 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 active:bg-stone-300 transition-all duration-200 disabled:opacity-50"
                title="Download plan as PDF"
              >
                <DownloadIcon className="w-4 h-4" />
                {downloadingPdf ? "..." : "PDF"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Swap modal */}
      {swapSlot && activePlan && (
        <SlotSwapModal
          slot={swapSlot.slot}
          currentMealId={swapSlot.currentMealId}
          planMealIds={activePlan.items.map((i) => i.meal_id)}
          onSwap={handleSwap}
          onClose={() => setSwapSlot(null)}
        />
      )}

      {/* Meal datasheet modal */}
      {detailItem && activePlan && (
        <MealDatasheet
          meal={detailItem.meal}
          targetMacros={activePlan.target_macros}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}

/** Recompute repeated_meal_ids for a given day index after a swap. */
function recomputeRepeats(
  plans: MultiDayPlan["plans"],
  dayIndex: number,
): string[] {
  const usedBefore = new Set<string>();
  for (let i = 0; i < dayIndex; i++) {
    for (const item of plans[i].items) {
      usedBefore.add(item.meal_id);
    }
  }
  return plans[dayIndex].items
    .filter((item) => usedBefore.has(item.meal_id))
    .map((item) => item.meal_id);
}
