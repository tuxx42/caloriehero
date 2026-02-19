import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PosterOrderPoller } from "../poller.js";
import { PosterClient } from "../client.js";
import { IncomingOrdersEndpoint } from "../endpoints/incoming-orders.js";
import type { PosterOrder, PosterOrderStatus } from "@caloriehero/shared-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOrder(
  id: string,
  status: string,
  products: PosterOrder["products"] = []
): PosterOrder {
  return { incomingOrderId: id, status, products };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PosterOrderPoller", () => {
  const getIncomingOrderMock = vi.fn<(id: string) => Promise<PosterOrder>>();
  let poller: PosterOrderPoller;

  beforeEach(() => {
    vi.useFakeTimers();

    const fakeClient = {} as unknown as PosterClient;
    const fakeEndpoint = {
      getIncomingOrder: getIncomingOrderMock,
    } as unknown as IncomingOrdersEndpoint;

    poller = new PosterOrderPoller(fakeClient, 5000, fakeEndpoint);
  });

  afterEach(() => {
    poller.stopAll();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("calls callback when order status changes", async () => {
    getIncomingOrderMock
      .mockResolvedValueOnce(makeOrder("1", "new"))
      .mockResolvedValueOnce(makeOrder("1", "accepted"));

    const callback = vi.fn<(status: PosterOrderStatus) => void>();
    poller.watchOrder("1", callback);

    // First tick — initial status "new"
    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).toHaveBeenCalledWith("new");

    // Second tick — status changes to "accepted"
    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).toHaveBeenCalledWith("accepted");
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("does NOT call callback when status has not changed", async () => {
    getIncomingOrderMock
      .mockResolvedValueOnce(makeOrder("2", "new"))
      .mockResolvedValueOnce(makeOrder("2", "new"))
      .mockResolvedValueOnce(makeOrder("2", "accepted"));

    const callback = vi.fn<(status: PosterOrderStatus) => void>();
    poller.watchOrder("2", callback);

    await vi.advanceTimersByTimeAsync(5000); // "new" — first call, callback fires
    await vi.advanceTimersByTimeAsync(5000); // "new" — unchanged, no fire
    await vi.advanceTimersByTimeAsync(5000); // "accepted" — changed, callback fires

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(1, "new");
    expect(callback).toHaveBeenNthCalledWith(2, "accepted");
  });

  it("stopWatching cancels the interval for a specific order", async () => {
    getIncomingOrderMock.mockResolvedValue(makeOrder("3", "new"));

    const callback = vi.fn<(status: PosterOrderStatus) => void>();
    poller.watchOrder("3", callback);

    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    poller.stopWatching("3");

    await vi.advanceTimersByTimeAsync(10000);
    // Should still be 1 — no more calls after stop
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("handles polling errors gracefully without throwing", async () => {
    getIncomingOrderMock
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(makeOrder("4", "ready"));

    const callback = vi.fn<(status: PosterOrderStatus) => void>();
    poller.watchOrder("4", callback);

    // First tick throws — callback should NOT be called
    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).not.toHaveBeenCalled();

    // Second tick succeeds — callback should be called
    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).toHaveBeenCalledWith("ready");
  });

  it("stopAll clears all active intervals", async () => {
    getIncomingOrderMock.mockResolvedValue(makeOrder("5", "new"));

    const cb1 = vi.fn<(status: PosterOrderStatus) => void>();
    const cb2 = vi.fn<(status: PosterOrderStatus) => void>();

    poller.watchOrder("5", cb1);
    poller.watchOrder("6", cb2);

    await vi.advanceTimersByTimeAsync(5000);
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);

    poller.stopAll();

    await vi.advanceTimersByTimeAsync(15000);
    // Both watchers stopped — no additional calls
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
