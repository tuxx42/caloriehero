import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DailyPlan, DayPlan, MultiDayPlan, UserProfile } from "../api/types";
import type { BodyStats } from "./tdee";
import { calculateWeightProjection } from "./weightProjection";

const MARGIN = 15;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_HEIGHT = 297;
const FIBER_RDV = 28;
const SUGAR_RDV = 50;

const SLOT_COLORS: Record<string, [number, number, number]> = {
  breakfast: [16, 185, 129],  // emerald-500
  lunch: [59, 130, 246],      // blue-500
  dinner: [245, 158, 11],     // amber-500
  snack: [244, 63, 94],       // rose-500
};

const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

interface GeneratePlanPdfOptions {
  plan: DailyPlan;
  multiDayPlan?: MultiDayPlan;
  radarChartDataUrl?: string;
  userProfile?: UserProfile;
  bodyStats?: BodyStats;
  numDays?: number;
}

function formatTag(tag: string): string {
  return tag
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Render a single day's content onto the PDF. Returns the updated y position. */
function renderDay(
  doc: jsPDF,
  plan: DailyPlan,
  y: number,
  dayLabel?: string,
): number {
  const { actual_macros: actual, target_macros: target } = plan;

  function ensureSpace(needed: number) {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // --- Day header ---
  if (dayLabel) {
    ensureSpace(15);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(dayLabel, MARGIN, y + 5);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(plan.date, MARGIN + doc.getTextWidth(dayLabel) + 5, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(
      `${Math.round(plan.total_score * 100)}% match`,
      PAGE_WIDTH - MARGIN,
      y + 5,
      { align: "right" },
    );
    y += 10;
  }

  // --- Meal Schedule Table ---
  ensureSpace(50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Meal Schedule", MARGIN, y + 5);
  y += 8;

  const scheduleHead = ["Meal", "Item", "Cal", "Pro", "Carb", "Fat"];
  const scheduleBody = plan.items.map((item) => [
    SLOT_LABELS[item.slot] ?? item.slot,
    item.meal_name,
    `${Math.round(item.meal.calories)}`,
    `${Math.round(item.meal.protein)}g`,
    `${Math.round(item.meal.carbs)}g`,
    `${Math.round(item.meal.fat)}g`,
  ]);

  scheduleBody.push([
    "TOTAL",
    "",
    `${Math.round(actual.calories)}`,
    `${Math.round(actual.protein)}g`,
    `${Math.round(actual.carbs)}g`,
    `${Math.round(actual.fat)}g`,
  ]);
  scheduleBody.push([
    "TARGET",
    "",
    `${Math.round(target.calories)}`,
    `${Math.round(target.protein)}g`,
    `${Math.round(target.carbs)}g`,
    `${Math.round(target.fat)}g`,
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [scheduleHead],
    body: scheduleBody,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: { textColor: [55, 65, 81] },
    didParseCell(data) {
      if (data.section === "body" && data.row.index >= plan.items.length) {
        data.cell.styles.fontStyle = "bold";
        if (data.row.index === plan.items.length) {
          data.cell.styles.fillColor = [243, 244, 246];
        }
      }
    },
    theme: "grid",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 5;

  // --- Macro split bar ---
  ensureSpace(18);
  const proteinCal = actual.protein * 4;
  const carbsCal = actual.carbs * 4;
  const fatCal = actual.fat * 9;
  const totalMacroCal = proteinCal + carbsCal + fatCal || 1;
  const proteinPct = Math.round((proteinCal / totalMacroCal) * 100);
  const fatPct = Math.round((fatCal / totalMacroCal) * 100);
  const carbsPct = 100 - proteinPct - fatPct;

  const barHeight = 5;
  const proteinW = (proteinPct / 100) * CONTENT_WIDTH;
  const carbsW = (carbsPct / 100) * CONTENT_WIDTH;
  const fatW = CONTENT_WIDTH - proteinW - carbsW;

  doc.setFillColor(59, 130, 246);
  doc.rect(MARGIN, y, proteinW, barHeight, "F");
  doc.setFillColor(245, 158, 11);
  doc.rect(MARGIN + proteinW, y, carbsW, barHeight, "F");
  doc.setFillColor(244, 63, 94);
  doc.rect(MARGIN + proteinW + carbsW, y, fatW, barHeight, "F");
  y += barHeight + 2;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(
    `${proteinPct}% P / ${carbsPct}% C / ${fatPct}% F`,
    PAGE_WIDTH / 2,
    y + 3,
    { align: "center" },
  );
  y += 7;

  // --- Calorie contribution bar ---
  ensureSpace(15);
  const totalCal = actual.calories || 1;
  let barX = MARGIN;
  for (const item of plan.items) {
    const pct = item.meal.calories / totalCal;
    const w = pct * CONTENT_WIDTH;
    const color = SLOT_COLORS[item.slot] ?? SLOT_COLORS.snack;
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(barX, y, w, 4, "F");
    barX += w;
  }
  y += 6;

  // Legend
  doc.setFontSize(6);
  let legendX = MARGIN;
  for (const item of plan.items) {
    const color = SLOT_COLORS[item.slot] ?? SLOT_COLORS.snack;
    const pct = Math.round((item.meal.calories / totalCal) * 100);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(legendX, y, 2.5, 2.5, "F");
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "normal");
    const label = `${SLOT_LABELS[item.slot] ?? item.slot} ${pct}%`;
    doc.text(label, legendX + 3.5, y + 2);
    legendX += doc.getTextWidth(label) + 7;
  }
  y += 6;

  // --- Price for this day ---
  const dayPrice =
    plan.items.reduce((sum, item) => sum + item.meal.price, 0) +
    plan.total_extra_price;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(`Day Total: ฿${dayPrice.toFixed(0)}`, PAGE_WIDTH - MARGIN, y + 3, { align: "right" });
  y += 8;

  // --- FDA Nutrition Facts for this day ---
  y = renderFdaNutritionFacts(doc, plan, y);

  return y;
}

/** Render an FDA-style Nutrition Facts label. Returns updated y position. */
function renderFdaNutritionFacts(
  doc: jsPDF,
  plan: DailyPlan,
  y: number,
): number {
  const { actual_macros: actual, target_macros: target } = plan;

  if (y + 60 > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Nutrition Facts", MARGIN, y + 5);
  y += 8;

  doc.setFillColor(0, 0, 0);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 2, "F");
  y += 4;

  const totalFiber = plan.items.reduce((s, i) => s + (i.meal.fiber ?? 0), 0);
  const totalSugar = plan.items.reduce((s, i) => s + (i.meal.sugar ?? 0), 0);
  const fdaRows = [
    { label: "Total Fat", value: `${Math.round(actual.fat)}g`, dv: Math.round((actual.fat / target.fat) * 100), bold: true },
    { label: "Total Carbohydrate", value: `${Math.round(actual.carbs)}g`, dv: Math.round((actual.carbs / target.carbs) * 100), bold: true },
    { label: "  Dietary Fiber", value: `${Math.round(totalFiber)}g`, dv: Math.round((totalFiber / FIBER_RDV) * 100), bold: false },
    { label: "  Total Sugars", value: `${Math.round(totalSugar)}g`, dv: Math.round((totalSugar / SUGAR_RDV) * 100), bold: false },
    { label: "Protein", value: `${Math.round(actual.protein)}g`, dv: Math.round((actual.protein / target.protein) * 100), bold: true },
  ];

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Calories", MARGIN + 2, y + 4);
  doc.setFontSize(14);
  doc.text(`${Math.round(actual.calories)}`, MARGIN + CONTENT_WIDTH - 2, y + 4, { align: "right" });
  y += 7;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 1;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("% Daily Value*", MARGIN + CONTENT_WIDTH - 2, y + 3, { align: "right" });
  y += 5;

  for (const row of fdaRows) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);

    doc.setFontSize(8);
    doc.setFont("helvetica", row.bold ? "bold" : "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`${row.label} ${row.value}`, MARGIN + 2, y + 3.5);
    doc.setFont("helvetica", "bold");
    doc.text(`${row.dv}%`, MARGIN + CONTENT_WIDTH - 2, y + 3.5, { align: "right" });
    y += 5;
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 3;

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(
    `* Percent Daily Values are based on a ${Math.round(target.calories)} calorie diet.`,
    MARGIN + 2,
    y + 2,
  );
  y += 8;

  return y;
}

/** Render the overall summary section for a multi-day plan. */
function renderMultiDaySummary(
  doc: jsPDF,
  multiDayPlan: MultiDayPlan,
  y: number,
): number {
  function ensureSpace(needed: number) {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // --- Summary stats ---
  ensureSpace(30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Plan Summary", MARGIN, y + 5);
  y += 10;

  const avgScore =
    multiDayPlan.plans.reduce((s, p) => s + p.total_score, 0) /
    multiDayPlan.plans.length;
  const avgCal =
    multiDayPlan.plans.reduce((s, p) => s + p.actual_macros.calories, 0) /
    multiDayPlan.plans.length;
  const avgProtein =
    multiDayPlan.plans.reduce((s, p) => s + p.actual_macros.protein, 0) /
    multiDayPlan.plans.length;
  const avgCarbs =
    multiDayPlan.plans.reduce((s, p) => s + p.actual_macros.carbs, 0) /
    multiDayPlan.plans.length;
  const avgFat =
    multiDayPlan.plans.reduce((s, p) => s + p.actual_macros.fat, 0) /
    multiDayPlan.plans.length;
  const target = multiDayPlan.plans[0].target_macros;

  // Summary table
  const summaryHead = ["Metric", "Average / Day", "Target"];
  const summaryBody = [
    ["Match Score", `${Math.round(avgScore * 100)}%`, "100%"],
    ["Calories", `${Math.round(avgCal)} kcal`, `${Math.round(target.calories)} kcal`],
    ["Protein", `${Math.round(avgProtein)}g`, `${Math.round(target.protein)}g`],
    ["Carbs", `${Math.round(avgCarbs)}g`, `${Math.round(target.carbs)}g`],
    ["Fat", `${Math.round(avgFat)}g`, `${Math.round(target.fat)}g`],
    ["Unique Meals", `${multiDayPlan.total_unique_meals}`, ""],
    ["Repeated Meals", `${multiDayPlan.total_repeated_meals}`, ""],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [summaryHead],
    body: summaryBody,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: { textColor: [55, 65, 81] },
    theme: "grid",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 5;

  // --- Combined allergens across all days ---
  const allergenMap = new Map<string, Set<string>>();
  for (const dayPlan of multiDayPlan.plans) {
    for (const item of dayPlan.items) {
      for (const a of item.meal.allergens) {
        if (!allergenMap.has(a)) allergenMap.set(a, new Set());
        allergenMap.get(a)!.add(item.meal_name);
      }
    }
  }

  if (allergenMap.size > 0) {
    ensureSpace(15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("Allergens", MARGIN, y + 5);
    y += 9;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(239, 68, 68);
    for (const [allergen, meals] of allergenMap) {
      ensureSpace(6);
      doc.text(
        `${formatTag(allergen)} — ${[...meals].join(", ")}`,
        MARGIN + 2,
        y + 3,
      );
      y += 5;
    }
    y += 3;
  }

  // --- Combined dietary tags ---
  const dietaryTags = [
    ...new Set(
      multiDayPlan.plans.flatMap((p) =>
        p.items.flatMap((item) => item.meal.dietary_tags),
      ),
    ),
  ];

  if (dietaryTags.length > 0) {
    ensureSpace(12);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("Dietary Tags", MARGIN, y + 5);
    y += 9;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(16, 185, 129);
    doc.text(dietaryTags.map(formatTag).join(", "), MARGIN + 2, y + 3);
    y += 8;
  }

  // --- Total price ---
  ensureSpace(12);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Total Price", MARGIN, y + 5);
  y += 9;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(`฿${multiDayPlan.total_price.toFixed(0)}`, MARGIN + 2, y + 5);
  y += 10;

  return y;
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  active: "Active",
  very_active: "Very Active",
};

/** Render a "Your Profile" section with profile info and macro targets. */
function renderUserProfile(
  doc: jsPDF,
  profile: UserProfile,
  y: number,
): number {
  if (y + 40 > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Your Profile", MARGIN, y + 5);
  y += 8;

  const profileBody: string[][] = [
    ["Fitness Goal", formatTag(profile.fitness_goal)],
  ];
  if (profile.weight_kg != null) profileBody.push(["Weight", `${profile.weight_kg} kg`]);
  if (profile.height_cm != null) profileBody.push(["Height", `${profile.height_cm} cm`]);
  if (profile.age != null) profileBody.push(["Age", `${profile.age}`]);
  if (profile.gender) profileBody.push(["Gender", formatTag(profile.gender)]);
  if (profile.activity_level) profileBody.push(["Activity", ACTIVITY_LABELS[profile.activity_level] ?? formatTag(profile.activity_level)]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN + CONTENT_WIDTH / 2 },
    head: [["Field", "Value"]],
    body: profileBody,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: { textColor: [55, 65, 81] },
    theme: "grid",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 3;

  // Allergies & dietary preferences
  if (profile.allergies.length > 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text(`Allergies: ${profile.allergies.map(formatTag).join(", ")}`, MARGIN, y + 3);
    y += 5;
  }
  if (profile.dietary_preferences.length > 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`Dietary Preferences: ${profile.dietary_preferences.map(formatTag).join(", ")}`, MARGIN, y + 3);
    y += 5;
  }

  // Macro targets table
  if (y + 25 > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Macro Targets", MARGIN, y + 4);
  y += 6;

  const mt = profile.macro_targets;
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN + CONTENT_WIDTH / 2 },
    head: [["Nutrient", "Target"]],
    body: [
      ["Calories", `${Math.round(mt.calories)} kcal`],
      ["Protein", `${Math.round(mt.protein)}g`],
      ["Carbs", `${Math.round(mt.carbs)}g`],
      ["Fat", `${Math.round(mt.fat)}g`],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: { textColor: [55, 65, 81] },
    theme: "grid",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 5;

  return y;
}

/** Render a weight projection box. Returns updated y position. */
function renderWeightProjection(
  doc: jsPDF,
  bodyStats: BodyStats,
  dailyCalories: number,
  numDays: number,
  y: number,
): number {
  if (y + 35 > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }

  const projection = calculateWeightProjection(bodyStats, dailyCalories, numDays);
  const isSurplus = projection.dailySurplus >= 0;
  const projectedWeight = bodyStats.weight + projection.weightChangeKg;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Weight Projection", MARGIN, y + 5);
  y += 8;

  // Box background
  doc.setFillColor(isSurplus ? 240 : 254, isSurplus ? 253 : 242, isSurplus ? 244 : 242);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 28, 2, 2, "F");

  const textColor: [number, number, number] = isSurplus ? [22, 163, 74] : [220, 38, 38];
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);

  doc.text(`TDEE: ${projection.tdee} kcal/day`, MARGIN + 3, y + 5);
  doc.text(
    `Daily ${isSurplus ? "surplus" : "deficit"}: ${Math.abs(Math.round(projection.dailySurplus))} kcal`,
    MARGIN + 3,
    y + 10,
  );
  doc.text(
    `Over ${numDays} days: ${Math.abs(Math.round(projection.totalSurplus))} kcal total`,
    MARGIN + 3,
    y + 15,
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text(
    `${bodyStats.weight.toFixed(1)} kg → ${projectedWeight.toFixed(1)} kg (${isSurplus ? "+" : ""}${projection.weightChangeKg.toFixed(1)} kg)`,
    MARGIN + 3,
    y + 22,
  );

  y += 33;

  return y;
}

export async function generatePlanPdf({
  plan,
  multiDayPlan,
  radarChartDataUrl,
  userProfile,
  bodyStats,
  numDays,
}: GeneratePlanPdfOptions): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const isMultiDay = multiDayPlan && multiDayPlan.plans.length > 1;

  let y = MARGIN;

  // --- Title page ---
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);

  if (isMultiDay) {
    doc.text(`${multiDayPlan.days}-Day Meal Plan`, MARGIN, y + 7);

    // Date range
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    const firstDate = multiDayPlan.plans[0].date;
    const lastDate = multiDayPlan.plans[multiDayPlan.plans.length - 1].date;
    doc.text(`${firstDate} — ${lastDate}`, PAGE_WIDTH - MARGIN, y + 3, { align: "right" });

    // Avg match score
    const avgScore =
      multiDayPlan.plans.reduce((s, p) => s + p.total_score, 0) /
      multiDayPlan.plans.length;
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${Math.round(avgScore * 100)}% avg match`,
      PAGE_WIDTH - MARGIN,
      y + 8,
      { align: "right" },
    );
    y += 15;

    // --- User profile ---
    if (userProfile) {
      y = renderUserProfile(doc, userProfile, y);
    }

    // --- Weight projection ---
    if (bodyStats && numDays) {
      const avgDailyCal =
        multiDayPlan.plans.reduce((s, p) => s + p.actual_macros.calories, 0) /
        multiDayPlan.plans.length;
      y = renderWeightProjection(doc, bodyStats, avgDailyCal, numDays, y);
    }

    // Render summary
    y = renderMultiDaySummary(doc, multiDayPlan, y);

    // Render each day on a new page
    for (let i = 0; i < multiDayPlan.plans.length; i++) {
      doc.addPage();
      y = MARGIN;
      const dayPlan = multiDayPlan.plans[i];
      const dayLabel = `Day ${(dayPlan as DayPlan).day ?? i + 1}`;
      y = renderDay(doc, dayPlan, y, dayLabel);
    }
  } else {
    // Single day
    doc.text("Daily Meal Plan", MARGIN, y + 7);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(plan.date, PAGE_WIDTH - MARGIN, y + 3, { align: "right" });
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${Math.round(plan.total_score * 100)}% match`,
      PAGE_WIDTH - MARGIN,
      y + 8,
      { align: "right" },
    );
    y += 15;

    // --- User profile ---
    if (userProfile) {
      y = renderUserProfile(doc, userProfile, y);
    }

    // --- Weight projection ---
    if (bodyStats && numDays) {
      y = renderWeightProjection(doc, bodyStats, plan.actual_macros.calories, numDays, y);
    }

    y = renderDay(doc, plan, y);

    // --- Radar chart ---
    if (radarChartDataUrl) {
      if (y + 65 > PAGE_HEIGHT - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }
      const chartWidth = 55;
      const chartX = MARGIN + (CONTENT_WIDTH - chartWidth) / 2;
      doc.addImage(radarChartDataUrl, "PNG", chartX, y, chartWidth, chartWidth);
      y += chartWidth + 5;
    }

    // --- Allergens ---
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

    if (allergenMap.size > 0) {
      if (y + 15 > PAGE_HEIGHT - MARGIN) { doc.addPage(); y = MARGIN; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Allergens", MARGIN, y + 5);
      y += 9;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(239, 68, 68);
      for (const [allergen, slots] of allergenMap) {
        if (y + 6 > PAGE_HEIGHT - MARGIN) { doc.addPage(); y = MARGIN; }
        const slotNames = slots
          .map((s) => SLOT_LABELS[s] ?? (s.charAt(0).toUpperCase() + s.slice(1)))
          .join(", ");
        doc.text(
          `${formatTag(allergen)} (${slotNames})`,
          MARGIN + 2,
          y + 3,
        );
        y += 5;
      }
      y += 3;
    }

    // --- Dietary tags ---
    const dietaryTags = [
      ...new Set(plan.items.flatMap((item) => item.meal.dietary_tags)),
    ];

    if (dietaryTags.length > 0) {
      if (y + 12 > PAGE_HEIGHT - MARGIN) { doc.addPage(); y = MARGIN; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Dietary Tags", MARGIN, y + 5);
      y += 9;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(16, 185, 129);
      doc.text(dietaryTags.map(formatTag).join(", "), MARGIN + 2, y + 3);
      y += 8;
    }

    // --- Total price ---
    if (y + 12 > PAGE_HEIGHT - MARGIN) { doc.addPage(); y = MARGIN; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("Total Price", MARGIN, y + 5);
    y += 9;

    const totalPrice =
      plan.items.reduce((sum, item) => sum + item.meal.price, 0) +
      plan.total_extra_price;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(`฿${totalPrice.toFixed(0)}`, MARGIN + 2, y + 5);
  }

  // Save
  const filename = isMultiDay
    ? `meal-plan-${multiDayPlan.days}day-${multiDayPlan.plans[0].date}.pdf`
    : `meal-plan-${plan.date}.pdf`;
  doc.save(filename);
}
