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

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {Math.round(value)}/{Math.round(target)}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
