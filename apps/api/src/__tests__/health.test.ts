import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildApp } from "../app.js";
import type { FastifyInstance } from "fastify";

describe("Health routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp({ useMockAuth: true });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /health returns 200 with status ok", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("GET /ready returns 200 with status ready", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ready" });
  });

  it("GET /health responds quickly (basic smoke test)", async () => {
    const start = Date.now();
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });
    const elapsed = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(elapsed).toBeLessThan(1000);
  });
});
