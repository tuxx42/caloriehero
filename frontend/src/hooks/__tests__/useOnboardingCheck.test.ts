import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock getMe
const mockGetMe = vi.fn();
vi.mock("../../api/endpoints/users", () => ({
  getMe: () => mockGetMe(),
}));

import { useOnboardingCheck } from "../useOnboardingCheck";

describe("useOnboardingCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /onboarding when profile is null", async () => {
    mockGetMe.mockResolvedValue({ profile: null });
    const { result } = renderHook(() => useOnboardingCheck());
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/onboarding", {
        replace: true,
      });
    });
    expect(result.current.ready).toBe(false);
  });

  it("sets ready=true when profile exists", async () => {
    mockGetMe.mockResolvedValue({
      profile: { macro_targets: { calories: 2000 } },
    });
    const { result } = renderHook(() => useOnboardingCheck());
    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("sets ready=true on error (graceful fallback)", async () => {
    mockGetMe.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useOnboardingCheck());
    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("starts with ready=false", () => {
    mockGetMe.mockReturnValue(new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useOnboardingCheck());
    expect(result.current.ready).toBe(false);
  });
});
