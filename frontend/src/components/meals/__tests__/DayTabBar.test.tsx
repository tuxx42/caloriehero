import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DayTabBar } from "../DayTabBar";
import type { DayPlan } from "../../../api/types";

const basePlan: Omit<DayPlan, "day" | "date" | "repeated_meal_ids"> = {
  id: "plan-1",
  total_score: 0.9,
  actual_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
  target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
  total_extra_price: 0,
  items: [],
};

const mockPlans: DayPlan[] = [
  { ...basePlan, day: 1, date: "2026-02-22", repeated_meal_ids: [] },
  { ...basePlan, day: 2, date: "2026-02-23", repeated_meal_ids: ["meal-1"] },
  { ...basePlan, day: 3, date: "2026-02-24", repeated_meal_ids: [] },
];

describe("DayTabBar", () => {
  it("renders a tab for each day", () => {
    render(<DayTabBar plans={mockPlans} activeDay={1} onDayChange={() => {}} />);
    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("Day 2")).toBeInTheDocument();
    expect(screen.getByText("Day 3")).toBeInTheDocument();
  });

  it("highlights active day with aria-selected", () => {
    render(<DayTabBar plans={mockPlans} activeDay={2} onDayChange={() => {}} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("calls onDayChange when a tab is clicked", () => {
    const onChange = vi.fn();
    render(<DayTabBar plans={mockPlans} activeDay={1} onDayChange={onChange} />);
    fireEvent.click(screen.getByText("Day 3"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("shows amber dot on tabs with repeated meals", () => {
    render(<DayTabBar plans={mockPlans} activeDay={1} onDayChange={() => {}} />);
    const dots = document.querySelectorAll(".bg-amber-400");
    expect(dots).toHaveLength(1); // Only day 2 has repeats
  });
});
