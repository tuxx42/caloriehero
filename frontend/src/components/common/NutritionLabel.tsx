interface NutritionLabelProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  servingSize?: string;
  /** Targets for %DV calculation. If omitted, uses FDA 2000-cal defaults. */
  targets?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
}

const FDA_DEFAULTS = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
  fiber: 28,
  sugar: 50,
};

function dvPct(actual: number, target: number): number {
  return Math.round((actual / target) * 100);
}

export function NutritionLabel({
  calories,
  protein,
  carbs,
  fat,
  fiber,
  sugar,
  servingSize,
  targets,
}: NutritionLabelProps) {
  const t = { ...FDA_DEFAULTS, ...targets };

  return (
    <div className="border-2 border-black p-2 max-w-[280px] font-sans text-sm" data-testid="nutrition-label">
      {/* Top bar */}
      <div className="bg-black h-2 -mx-2 -mt-2 mb-1" />

      <h3
        className="text-2xl leading-tight tracking-tight mb-0.5"
        style={{ fontFamily: "'Helvetica Neue', 'Arial Black', Arial, sans-serif", fontWeight: 900 }}
      >
        Nutrition Facts
      </h3>

      {servingSize && (
        <div className="text-xs text-gray-700 mb-1">
          Serving size: {servingSize}
        </div>
      )}

      {/* Thick rule */}
      <div className="border-t-[8px] border-black my-1" />

      {/* Calories */}
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-bold">Calories</span>
        <span className="text-2xl font-black">{Math.round(calories)}</span>
      </div>

      {/* Thin rule */}
      <div className="border-t border-black my-1" />

      {/* %DV header */}
      <div className="text-right text-xs font-bold mb-0.5">% Daily Value*</div>

      {/* Nutrient rows */}
      <div className="border-t border-black">
        <NutrientRow label="Total Fat" value={`${Math.round(fat)}g`} dv={dvPct(fat, t.fat)} bold />
        <NutrientRow label="Total Carbohydrate" value={`${Math.round(carbs)}g`} dv={dvPct(carbs, t.carbs)} bold />
        {fiber != null && (
          <NutrientRow label="Dietary Fiber" value={`${Math.round(fiber)}g`} dv={dvPct(fiber, t.fiber)} indent />
        )}
        {sugar != null && (
          <NutrientRow label="Total Sugars" value={`${Math.round(sugar)}g`} dv={dvPct(sugar, t.sugar)} indent />
        )}
        <NutrientRow label="Protein" value={`${Math.round(protein)}g`} dv={dvPct(protein, t.protein)} bold />
      </div>

      {/* Thick bottom rule */}
      <div className="border-t-[4px] border-black mt-1 mb-1" />

      {/* Footnote */}
      <p className="text-[10px] leading-tight text-gray-600">
        * Percent Daily Values are based on a {t.calories} calorie diet.
      </p>
    </div>
  );
}

function NutrientRow({
  label,
  value,
  dv,
  bold,
  indent,
}: {
  label: string;
  value: string;
  dv: number;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div className={`flex justify-between py-0.5 border-t border-gray-300 text-xs ${indent ? "pl-4" : ""}`}>
      <span className={bold ? "font-bold" : ""}>
        {label} {value}
      </span>
      <span className="font-bold">{dv}%</span>
    </div>
  );
}
