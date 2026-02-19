import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildApp } from "../app.js";
import { createMockToken } from "../plugins/auth.js";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/index.js";

// Mock the service modules so we don't need a real DB
vi.mock("../services/user-service.js", () => ({
  getUser: vi.fn(),
  findOrCreateUser: vi.fn(),
}));

vi.mock("../services/profile-service.js", () => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
}));

import * as userService from "../services/user-service.js";
import * as profileService from "../services/profile-service.js";

const authUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@test.com",
  name: "Test User",
  isAdmin: false,
};

const sampleUser = {
  id: authUser.id,
  googleId: "google-123",
  email: authUser.email,
  name: authUser.name,
  isAdmin: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const sampleProfile = {
  userId: authUser.id,
  macroTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
  fitnessGoal: "maintain",
  allergies: [],
  dietaryPreferences: ["high_protein"],
  deliveryAddress: undefined,
  deliveryLat: undefined,
  deliveryLng: undefined,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("User routes", () => {
  let app: FastifyInstance;
  const stubDb = {} as Database;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp({ useMockAuth: true, db: stubDb });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /api/v1/users/me", () => {
    it("returns the current user when authenticated", async () => {
      vi.mocked(userService.getUser).mockResolvedValue(sampleUser);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<typeof sampleUser>();
      expect(body.email).toBe(authUser.email);
      expect(body.id).toBe(authUser.id);
    });

    it("returns 401 when no token is provided", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
      });

      expect(response.statusCode).toBe(401);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 404 when user does not exist in database", async () => {
      vi.mocked(userService.getUser).mockResolvedValue(null);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("GET /api/v1/users/me/profile", () => {
    it("returns the user profile when it exists", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(sampleProfile);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users/me/profile",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<typeof sampleProfile>();
      expect(body.fitnessGoal).toBe("maintain");
      expect(body.macroTargets.calories).toBe(2000);
    });

    it("returns 404 when profile does not exist", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(null);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/users/me/profile",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PUT /api/v1/users/me/profile", () => {
    it("creates or updates the profile and returns it", async () => {
      vi.mocked(profileService.upsertProfile).mockResolvedValue(sampleProfile);
      const token = createMockToken(authUser);

      const body = {
        macroTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
        fitnessGoal: "maintain",
        dietaryPreferences: ["high_protein"],
      };

      const response = await app.inject({
        method: "PUT",
        url: "/api/v1/users/me/profile",
        headers: { Authorization: `Bearer ${token}` },
        payload: body,
      });

      expect(response.statusCode).toBe(200);
      const result = response.json<typeof sampleProfile>();
      expect(result.macroTargets.calories).toBe(2000);
      expect(profileService.upsertProfile).toHaveBeenCalledWith(
        stubDb,
        authUser.id,
        expect.objectContaining({ fitnessGoal: "maintain" })
      );
    });

    it("returns 401 when no token is provided", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/api/v1/users/me/profile",
        payload: {
          macroTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
          fitnessGoal: "maintain",
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
