import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../auth";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it("starts logged out", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
  });

  it("login sets token and user", () => {
    const user = { id: "1", email: "test@test.com", name: "Test", is_admin: false };
    useAuthStore.getState().login("tok123", user);

    const state = useAuthStore.getState();
    expect(state.token).toBe("tok123");
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated()).toBe(true);
  });

  it("logout clears state", () => {
    const user = { id: "1", email: "test@test.com", name: "Test", is_admin: false };
    useAuthStore.getState().login("tok123", user);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });
});
