import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PosterClient } from "../client.js";
import { PosterApiError } from "../errors.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PosterClient", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let client: PosterClient;

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    client = new PosterClient({
      apiUrl: "https://joinposter.com/api",
      accessToken: "test-token",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("GET requests", () => {
    it("appends token to the URL and returns parsed JSON", async () => {
      const payload = { response: { data: 42 } };
      fetchMock.mockResolvedValueOnce(makeResponse(payload));

      const result = await client.get<typeof payload>("/menu.getProducts");

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toContain("token=test-token");
      expect((options as RequestInit).method).toBe("GET");
      expect(result).toEqual(payload);
    });

    it("appends extra query params alongside the token", async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ response: {} }));

      await client.get("/incomingOrders.getIncomingOrder", {
        params: { incoming_order_id: "42" },
      });

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toContain("incoming_order_id=42");
      expect(url).toContain("token=test-token");
    });
  });

  describe("POST requests", () => {
    it("sends JSON body and returns parsed response", async () => {
      const responseBody = { response: { incoming_order_id: "99" } };
      fetchMock.mockResolvedValueOnce(makeResponse(responseBody));

      const result = await client.post<typeof responseBody>(
        "/incomingOrders.createIncomingOrder",
        { products: [{ product_id: "1", count: 2 }] }
      );

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toContain("token=test-token");
      expect((options as RequestInit).method).toBe("POST");
      expect((options as RequestInit).headers).toMatchObject({
        "Content-Type": "application/json",
      });
      expect(result).toEqual(responseBody);
    });
  });

  describe("retry logic", () => {
    it("retries on 5xx errors up to 3 times then throws", async () => {
      fetchMock.mockResolvedValue(makeResponse({ error: "server error" }, 500));

      await expect(client.get("/menu.getProducts")).rejects.toThrow(
        PosterApiError
      );

      // Initial attempt + 3 retries = 4 total calls
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it("succeeds on the second attempt after a 5xx", async () => {
      const success = { response: { ok: true } };
      fetchMock
        .mockResolvedValueOnce(makeResponse({ error: "server error" }, 500))
        .mockResolvedValueOnce(makeResponse(success));

      const result = await client.get<typeof success>("/menu.getProducts");

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual(success);
    });

    it("does NOT retry on 4xx errors", async () => {
      fetchMock.mockResolvedValueOnce(
        makeResponse({ error: "not found" }, 404)
      );

      await expect(client.get("/menu.getProducts")).rejects.toThrow(
        PosterApiError
      );

      // Should fail immediately — no retries
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("PosterApiError", () => {
    it("throws PosterApiError with statusCode on non-2xx response", async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ error: "bad request" }, 400));

      try {
        await client.get("/menu.getProducts");
        expect.fail("Expected PosterApiError to be thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PosterApiError);
        const apiError = err as PosterApiError;
        expect(apiError.statusCode).toBe(400);
      }
    });

    it("PosterApiError includes the response body", async () => {
      const body = { error: "Unauthorized", code: 401 };
      fetchMock.mockResolvedValueOnce(makeResponse(body, 401));

      try {
        await client.get("/menu.getProducts");
        expect.fail("Expected PosterApiError to be thrown");
      } catch (err) {
        const apiError = err as PosterApiError;
        expect(apiError.responseBody).toEqual(body);
      }
    });
  });
});
