import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { OnboardingPage } from "../Onboarding";

// Mock the users API
vi.mock("../../api/endpoints/users", () => ({
  updateProfile: vi.fn(() => Promise.resolve({})),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders welcome screen on initial load", () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Let's personalize your nutrition"),
    ).toBeDefined();
    expect(screen.getByText("Get Started")).toBeDefined();
    expect(screen.getByText("Skip for now")).toBeDefined();
  });

  it("navigates to step 1 when Get Started is clicked", () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Get Started"));
    expect(screen.getByText("What's your fitness goal?")).toBeDefined();
  });

  it("navigates through all steps", () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );

    // Step 0 → 1
    fireEvent.click(screen.getByText("Get Started"));
    expect(screen.getByText("What's your fitness goal?")).toBeDefined();

    // Step 1 → 2
    fireEvent.click(screen.getByText("Continue"));
    expect(screen.getByText("Your body stats")).toBeDefined();

    // Step 2 → 3
    fireEvent.click(screen.getByText("Calculate Macros"));
    expect(screen.getByText("Your daily macro targets")).toBeDefined();

    // Step 3 → 4
    fireEvent.click(screen.getByText("Continue"));
    expect(screen.getByText("Dietary preferences")).toBeDefined();
  });

  it("calls skip with default values and navigates home", async () => {
    const { updateProfile } = await import("../../api/endpoints/users");
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Skip for now"));
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          macro_targets: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          fitness_goal: "maintenance",
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("calls finish with calculated values", async () => {
    const { updateProfile } = await import("../../api/endpoints/users");
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );
    // Navigate through all steps
    fireEvent.click(screen.getByText("Get Started"));
    fireEvent.click(screen.getByText("Continue"));
    fireEvent.click(screen.getByText("Calculate Macros"));
    fireEvent.click(screen.getByText("Continue"));
    fireEvent.click(screen.getByText("Finish Setup"));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fitness_goal: "maintenance",
          allergies: [],
          dietary_preferences: [],
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("shows progress bar with correct step count", () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Step 1 of 5")).toBeDefined();

    fireEvent.click(screen.getByText("Get Started"));
    expect(screen.getByText("Step 2 of 5")).toBeDefined();
  });
});
