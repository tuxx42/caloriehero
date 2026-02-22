import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DailyPlan } from "../api/types";

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

interface GeneratePlanPdfOptions {
  plan: DailyPlan;
  radarChartDataUrl?: string;
}

function formatTag(tag: string): string {
  return tag
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generatePlanPdf({
  plan,
  radarChartDataUrl,
}: GeneratePlanPdfOptions): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const { actual_macros: actual, target_macros: target } = plan;

  let y = MARGIN;

  function ensureSpace(needed: number) {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // --- 1. Title ---
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text("Daily Meal Plan", MARGIN, y + 7);

  // Date + match score right-aligned
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(plan.date, PAGE_WIDTH - MARGIN, y + 3, { align: "right" });
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.setFont("helvetica", "bold");
  doc.text(
    `${Math.round(plan.total_score * 100)}% match`,
    PAGE_WIDTH - MARGIN,
    y + 8,
    { align: "right" },
  );
  y += 15;

  // --- 2. Radar chart ---
  if (radarChartDataUrl) {
    ensureSpace(65);
    const chartWidth = 55;
    const chartX = MARGIN + (CONTENT_WIDTH - chartWidth) / 2;
    doc.addImage(radarChartDataUrl, "PNG", chartX, y, chartWidth, chartWidth);
    y += chartWidth + 5;
  }

  // --- 3. Macro split bar ---
  ensureSpace(20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Macro Split", MARGIN, y + 5);
  y += 9;

  const proteinCal = actual.protein * 4;
  const carbsCal = actual.carbs * 4;
  const fatCal = actual.fat * 9;
  const totalMacroCal = proteinCal + carbsCal + fatCal || 1;
  const proteinPct = Math.round((proteinCal / totalMacroCal) * 100);
  const fatPct = Math.round((fatCal / totalMacroCal) * 100);
  const carbsPct = 100 - proteinPct - fatPct;

  const barHeight = 6;
  const proteinW = (proteinPct / 100) * CONTENT_WIDTH;
  const carbsW = (carbsPct / 100) * CONTENT_WIDTH;
  const fatW = CONTENT_WIDTH - proteinW - carbsW;

  doc.setFillColor(59, 130, 246); // blue
  doc.rect(MARGIN, y, proteinW, barHeight, "F");
  doc.setFillColor(245, 158, 11); // amber
  doc.rect(MARGIN + proteinW, y, carbsW, barHeight, "F");
  doc.setFillColor(244, 63, 94); // rose
  doc.rect(MARGIN + proteinW + carbsW, y, fatW, barHeight, "F");
  y += barHeight + 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(
    `${proteinPct}% P / ${carbsPct}% C / ${fatPct}% F`,
    PAGE_WIDTH / 2,
    y + 3,
    { align: "center" },
  );
  y += 8;

  // --- 4. Calorie & macro gap ---
  ensureSpace(30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Calorie & Macro Gap", MARGIN, y + 5);
  y += 10;

  const calorieDelta = actual.calories - target.calories;
  const sign = calorieDelta >= 0 ? "+" : "";
  const deltaLabel = calorieDelta >= 0 ? "over target" : "under target";
  if (calorieDelta >= 0) {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(239, 68, 68);
  }
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${sign}${Math.round(calorieDelta)} kcal`, MARGIN, y + 5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(deltaLabel, MARGIN + 45, y + 5);
  y += 10;

  const totalFiber = plan.items.reduce((s, i) => s + (i.meal.fiber ?? 0), 0);
  const macroGaps = [
    { label: "Protein", delta: actual.protein - target.protein, unit: "g" },
    { label: "Carbs", delta: actual.carbs - target.carbs, unit: "g" },
    { label: "Fat", delta: actual.fat - target.fat, unit: "g" },
    { label: "Fiber", delta: totalFiber - FIBER_RDV, unit: "g" },
  ];

  doc.setFontSize(9);
  const colW = CONTENT_WIDTH / 2;
  macroGaps.forEach((g, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = MARGIN + col * colW;
    const yPos = y + row * 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(g.label, xPos, yPos + 4);
    const s = g.delta >= 0 ? "+" : "";
    if (g.delta >= 0) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.setFont("helvetica", "bold");
    doc.text(`${s}${Math.round(g.delta)}${g.unit}`, xPos + colW - 5, yPos + 4, {
      align: "right",
    });
  });
  y += Math.ceil(macroGaps.length / 2) * 7 + 5;

  // --- 5. % Daily Values ---
  ensureSpace(50);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("% Daily Values", MARGIN, y + 5);
  y += 8;

  const totalSugar = plan.items.reduce((s, i) => s + (i.meal.sugar ?? 0), 0);
  const dailyValues = [
    { label: "Calories", actual: actual.calories, unit: "kcal", target: target.calories },
    { label: "Protein", actual: actual.protein, unit: "g", target: target.protein },
    { label: "Carbs", actual: actual.carbs, unit: "g", target: target.carbs },
    { label: "Fat", actual: actual.fat, unit: "g", target: target.fat },
    { label: "Fiber", actual: totalFiber, unit: "g", target: FIBER_RDV },
    { label: "Sugar", actual: totalSugar, unit: "g", target: SUGAR_RDV },
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Nutrient", "Actual", "%"]],
    body: dailyValues.map((r) => [
      r.label,
      `${Math.round(r.actual)} ${r.unit}`,
      `${Math.round((r.actual / r.target) * 100)}%`,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [55, 65, 81],
      fontStyle: "bold",
    },
    theme: "grid",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 5;

  // --- 6. Nutrition breakdown ---
  ensureSpace(50);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Nutrition Breakdown", MARGIN, y + 5);
  y += 8;

  const nutrients = [
    { key: "calories", label: "Calories", unit: "kcal", target: target.calories },
    { key: "protein", label: "Protein", unit: "g", target: target.protein },
    { key: "carbs", label: "Carbs", unit: "g", target: target.carbs },
    { key: "fat", label: "Fat", unit: "g", target: target.fat },
    { key: "fiber", label: "Fiber", unit: "g", target: FIBER_RDV },
    { key: "sugar", label: "Sugar", unit: "g", target: SUGAR_RDV },
  ] as const;

  const breakdownHead = [
    "",
    ...plan.items.map((i) =>
      i.meal_name.length > 10 ? i.meal_name.slice(0, 10) + "..." : i.meal_name,
    ),
    "Total",
    "Target",
    "%",
  ];

  const breakdownBody = nutrients.map((nut) => {
    const perMeal = plan.items.map((item) => {
      const val = item.meal[nut.key] ?? 0;
      return `${Math.round(val)}${nut.unit === "kcal" ? "" : nut.unit}`;
    });
    const total =
      nut.key === "calories" ? actual.calories
      : nut.key === "protein" ? actual.protein
      : nut.key === "carbs" ? actual.carbs
      : nut.key === "fat" ? actual.fat
      : nut.key === "fiber" ? totalFiber
      : totalSugar;
    const pct = Math.round((total / nut.target) * 100);
    return [
      nut.label,
      ...perMeal,
      `${Math.round(total)}${nut.unit === "kcal" ? "" : nut.unit}`,
      `${Math.round(nut.target)}${nut.unit === "kcal" ? "" : nut.unit}`,
      `${pct}%`,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [breakdownHead],
    body: breakdownBody,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [55, 65, 81],
      fontStyle: "bold",
    },
    theme: "grid",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 5;

  // --- 7. Calorie contribution bar ---
  ensureSpace(20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Calorie Contribution", MARGIN, y + 5);
  y += 9;

  const totalCal = actual.calories || 1;
  let barX = MARGIN;
  for (const item of plan.items) {
    const pct = item.meal.calories / totalCal;
    const w = pct * CONTENT_WIDTH;
    const color = SLOT_COLORS[item.slot] ?? SLOT_COLORS.snack;
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(barX, y, w, 5, "F");
    barX += w;
  }
  y += 8;

  // Legend
  doc.setFontSize(7);
  let legendX = MARGIN;
  for (const item of plan.items) {
    const color = SLOT_COLORS[item.slot] ?? SLOT_COLORS.snack;
    const pct = Math.round((item.meal.calories / totalCal) * 100);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(legendX, y, 3, 3, "F");
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "normal");
    const label = `${item.slot.charAt(0).toUpperCase() + item.slot.slice(1)} ${pct}%`;
    doc.text(label, legendX + 4, y + 2.5);
    legendX += doc.getTextWidth(label) + 8;
  }
  y += 8;

  // --- 8. Allergens ---
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
    ensureSpace(15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("Allergens", MARGIN, y + 5);
    y += 9;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(239, 68, 68); // red
    for (const [allergen, slots] of allergenMap) {
      ensureSpace(6);
      const slotNames = slots
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
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

  // --- 9. Dietary tags ---
  const dietaryTags = [
    ...new Set(plan.items.flatMap((item) => item.meal.dietary_tags)),
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

  // --- 10. Total price ---
  ensureSpace(12);
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

  // Save
  doc.save(`meal-plan-${plan.date}.pdf`);
}
