import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MacroBar } from "../MacroBar";

describe("MacroBar", () => {
  it("renders label and values", () => {
    render(<MacroBar label="Protein" value={120} target={150} />);
    expect(screen.getByText("Protein")).toBeInTheDocument();
    expect(screen.getByText("120/150g")).toBeInTheDocument();
  });

  it("uses custom unit", () => {
    render(<MacroBar label="Calories" value={1800} target={2000} unit="kcal" />);
    expect(screen.getByText("1800/2000kcal")).toBeInTheDocument();
  });

  it("caps bar width at 100%", () => {
    const { container } = render(
      <MacroBar label="Over" value={300} target={100} />,
    );
    const bar = container.querySelector("[style]");
    expect(bar?.getAttribute("style")).toContain("100%");
  });
});
