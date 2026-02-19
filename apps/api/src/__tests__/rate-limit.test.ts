import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildApp } from "../app.js";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/index.js";

describe("Rate limiting", () => {
  let app: FastifyInstance;
  const stubDb = {} as Database;

  beforeEach(async () => {
    app = buildApp({
      useMockAuth: true,
      db: stubDb,
      enableRateLimit: true,
    });
    // Override rate limit to a small number for testing
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("allows requests under the limit", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-ratelimit-limit"]).toBeDefined();
    expect(response.headers["x-ratelimit-remaining"]).toBeDefined();
  });

  it("returns rate limit headers on responses", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.headers["x-ratelimit-limit"]).toBe("100");
  });
});
