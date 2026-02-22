import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AdminDashboardPage } from "../Dashboard";

vi.mock("../../../api/endpoints/admin", () => ({
  getDashboardStats: vi.fn().mockResolvedValue({
    total_users: 42,
    total_orders: 150,
    total_meals: 20,
    active_subscriptions: 8,
    revenue: 45000,
    orders_by_status: { paid: 100, delivered: 40, pending_payment: 10 },
  }),
}));

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stat cards after loading", async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("renders revenue", async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    });
    expect(screen.getByText("฿45,000")).toBeInTheDocument();
  });

  it("renders orders by status", async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("paid")).toBeInTheDocument();
    });
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("delivered")).toBeInTheDocument();
  });
});
