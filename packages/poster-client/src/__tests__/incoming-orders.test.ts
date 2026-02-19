import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IncomingOrdersEndpoint } from "../endpoints/incoming-orders.js";
import { PosterClient } from "../client.js";
import { PosterApiError } from "../errors.js";
import type { PosterOrder } from "@caloriehero/shared-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePosterOrder(overrides: Partial<PosterOrder> = {}): PosterOrder {
  return {
    incomingOrderId: "100",
    status: "new",
    products: [{ productId: "1", count: 2, price: 150 }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("IncomingOrdersEndpoint", () => {
  const getMock = vi.fn();
  const postMock = vi.fn();

  let endpoint: IncomingOrdersEndpoint;

  beforeEach(() => {
    const fakeClient = {
      get: getMock,
      post: postMock,
    } as unknown as PosterClient;

    endpoint = new IncomingOrdersEndpoint(fakeClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createIncomingOrder", () => {
    it("posts to createIncomingOrder and returns incomingOrderId", async () => {
      postMock.mockResolvedValueOnce({
        response: { incoming_order_id: 42 },
      });

      const result = await endpoint.createIncomingOrder({
        products: [{ productId: "1", count: 2 }],
        firstName: "Alice",
        phone: "+7-999-123-4567",
      });

      expect(postMock).toHaveBeenCalledOnce();
      const [path, body] = postMock.mock.calls[0]!;
      expect(path).toBe("/incomingOrders.createIncomingOrder");
      expect(body).toMatchObject({
        products: [{ product_id: "1", count: 2 }],
        client: { firstname: "Alice", phone: "+7-999-123-4567" },
      });
      expect(result).toEqual({ incomingOrderId: "42" });
    });

    it("propagates errors from the client", async () => {
      postMock.mockRejectedValueOnce(new PosterApiError("fail", 500, {}));

      await expect(
        endpoint.createIncomingOrder({ products: [{ productId: "1", count: 1 }] })
      ).rejects.toThrow(PosterApiError);
    });
  });

  describe("getIncomingOrder", () => {
    it("fetches a single order by ID and maps it to PosterOrder", async () => {
      const raw = {
        response: {
          incoming_order_id: "100",
          status: "1",
          products: [{ product_id: "1", count: 2, price: 150 }],
        },
      };
      getMock.mockResolvedValueOnce(raw);

      const result = await endpoint.getIncomingOrder("100");

      expect(getMock).toHaveBeenCalledWith(
        "/incomingOrders.getIncomingOrder",
        { params: { incoming_order_id: "100" } }
      );
      expect(result).toMatchObject<PosterOrder>({
        incomingOrderId: "100",
        status: "1",
        products: [{ productId: "1", count: 2, price: 150 }],
      });
    });

    it("propagates PosterApiError when order not found", async () => {
      getMock.mockRejectedValueOnce(new PosterApiError("not found", 404, {}));

      await expect(endpoint.getIncomingOrder("999")).rejects.toThrow(PosterApiError);
    });
  });

  describe("getIncomingOrders", () => {
    it("returns an array of mapped PosterOrders", async () => {
      const raw = {
        response: [
          {
            incoming_order_id: "1",
            status: "2",
            products: [{ product_id: "5", count: 1, price: 200 }],
          },
          {
            incoming_order_id: "2",
            status: "3",
            products: [],
          },
        ],
      };
      getMock.mockResolvedValueOnce(raw);

      const result = await endpoint.getIncomingOrders();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject<PosterOrder>({
        incomingOrderId: "1",
        status: "2",
        products: [{ productId: "5", count: 1, price: 200 }],
      });
      expect(result[1]).toMatchObject<PosterOrder>({
        incomingOrderId: "2",
        status: "3",
        products: [],
      });
    });

    it("returns empty array when there are no orders", async () => {
      getMock.mockResolvedValueOnce({ response: [] });

      const result = await endpoint.getIncomingOrders();

      expect(result).toEqual([]);
    });

    it("propagates PosterApiError on failure", async () => {
      getMock.mockRejectedValueOnce(new PosterApiError("server error", 503, {}));

      await expect(endpoint.getIncomingOrders()).rejects.toThrow(PosterApiError);
    });
  });
});
