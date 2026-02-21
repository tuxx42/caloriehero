import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders status text", () => {
    render(<StatusBadge status="paid" />);
    expect(screen.getByText("paid")).toBeInTheDocument();
  });

  it("replaces underscores with spaces", () => {
    render(<StatusBadge status="pending_payment" />);
    expect(screen.getByText("pending payment")).toBeInTheDocument();
  });

  it("applies fallback style for unknown status", () => {
    render(<StatusBadge status="unknown" />);
    const badge = screen.getByText("unknown");
    expect(badge.className).toContain("bg-gray-100");
  });
});
