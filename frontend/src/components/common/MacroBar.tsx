interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color?: string;
}

export function MacroBar({
  label,
  value,
  target,
  unit = "g",
  color = "bg-emerald-500",
}: MacroBarProps) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const isOver = value > target;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-stone-600 font-medium">{label}</span>
        <span className={`font-semibold ${isOver ? "text-red-600" : "text-stone-900"}`}>
          {Math.round(value)}/{Math.round(target)}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
