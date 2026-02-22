import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderTimeline } from "../OrderTimeline";

describe("OrderTimeline", () => {
  it("renders all step labels", () => {
    render(<OrderTimeline currentStatus="pending_payment" />);
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Preparing")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Delivering")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("marks completed steps with emerald color", () => {
    render(<OrderTimeline currentStatus="preparing" />);
    // "Payment", "Paid", "Preparing" should all be done (indices 0, 1, 2)
    const labels = ["Payment", "Paid", "Preparing"];
    for (const label of labels) {
      const el = screen.getByText(label);
      expect(el.className).toContain("text-gray-900");
      expect(el.className).toContain("font-medium");
    }
  });

  it("marks future steps as gray", () => {
    render(<OrderTimeline currentStatus="paid" />);
    // "Preparing", "Ready", "Delivering", "Delivered" are future
    const futureLabels = ["Preparing", "Ready", "Delivering", "Delivered"];
    for (const label of futureLabels) {
      const el = screen.getByText(label);
      expect(el.className).toContain("text-gray-400");
    }
  });

  it("shows cancelled state", () => {
    render(<OrderTimeline currentStatus="cancelled" />);
    expect(screen.getByText("Order Cancelled")).toBeInTheDocument();
    // Regular steps should not be rendered
    expect(screen.queryByText("Payment")).not.toBeInTheDocument();
  });

  it("highlights the current step with a ring", () => {
    const { container } = render(<OrderTimeline currentStatus="ready" />);
    const dots = container.querySelectorAll(".rounded-full");
    // "ready" is index 3, its dot should have ring-4
    const readyDot = dots[3];
    expect(readyDot.className).toContain("ring-4");
    expect(readyDot.className).toContain("ring-emerald-100");
  });
});
