import { useEffect, useRef } from "react";
import type { DayPlan } from "../../api/types";

interface DayTabBarProps {
  plans: DayPlan[];
  activeDay: number;
  onDayChange: (day: number) => void;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function DayTabBar({ plans, activeDay, onDayChange }: DayTabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current?.scrollIntoView && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeDay]);

  return (
    <div
      ref={containerRef}
      className="flex gap-2 overflow-x-auto pb-2 scroll-snap-x-mandatory scrollbar-none"
      role="tablist"
    >
      {plans.map((plan) => {
        const isActive = plan.day === activeDay;
        const hasRepeats = plan.repeated_meal_ids.length > 0;

        return (
          <button
            key={plan.day}
            ref={isActive ? activeRef : undefined}
            role="tab"
            aria-selected={isActive}
            onClick={() => onDayChange(plan.day)}
            className={`
              flex-shrink-0 scroll-snap-start px-3 py-2 rounded-lg text-xs font-medium transition-colors
              ${isActive
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            <div className="flex items-center gap-1">
              <span>Day {plan.day}</span>
              {hasRepeats && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"
                  title="Contains repeated meals"
                />
              )}
            </div>
            <div className={`text-[10px] ${isActive ? "text-emerald-100" : "text-gray-400"}`}>
              {formatShortDate(plan.date)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
