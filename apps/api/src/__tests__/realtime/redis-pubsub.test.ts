import { describe, it, expect, vi, beforeEach } from "vitest";
import type Redis from "ioredis";
import { RedisPubSub } from "../../realtime/redis-pubsub.js";
import { SSEManager } from "../../realtime/sse-manager.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRedis() {
  return {
    publish: vi.fn().mockResolvedValue(1),
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  } as unknown as Redis;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RedisPubSub", () => {
  let pub: Redis;
  let sub: Redis;
  let sseManager: SSEManager;
  let pubsub: RedisPubSub;

  beforeEach(() => {
    pub = createMockRedis();
    sub = createMockRedis();
    sseManager = new SSEManager();
    pubsub = new RedisPubSub(pub, sub, sseManager);
  });

  describe("start", () => {
    it("subscribes to the order:status channel", async () => {
      await pubsub.start();

      expect(sub.subscribe).toHaveBeenCalledWith("order:status");
    });

    it("registers a message listener on the subscriber", async () => {
      await pubsub.start();

      expect(sub.on).toHaveBeenCalledWith("message", expect.any(Function));
    });

    it("routes valid messages to sseManager.sendEvent", async () => {
      const sendEventSpy = vi.spyOn(sseManager, "sendEvent");
      await pubsub.start();

      // Grab the registered message handler and invoke it directly
      const [[, handler]] = (sub.on as ReturnType<typeof vi.fn>).mock.calls! as [
        [string, (channel: string, message: string) => void]
      ];

      const event = {
        orderId: "order-abc",
        status: "processing",
        updatedAt: new Date().toISOString(),
      };

      handler!("order:status", JSON.stringify(event));

      expect(sendEventSpy).toHaveBeenCalledWith("order-abc", "status", event);
    });

    it("ignores messages on unexpected channels", async () => {
      const sendEventSpy = vi.spyOn(sseManager, "sendEvent");
      await pubsub.start();

      const [[, handler]] = (sub.on as ReturnType<typeof vi.fn>).mock.calls! as [
        [string, (channel: string, message: string) => void]
      ];

      handler!("other:channel", JSON.stringify({ orderId: "x", status: "y", updatedAt: "" }));

      expect(sendEventSpy).not.toHaveBeenCalled();
    });

    it("handles malformed JSON messages gracefully without throwing", async () => {
      await pubsub.start();

      const [[, handler]] = (sub.on as ReturnType<typeof vi.fn>).mock.calls! as [
        [string, (channel: string, message: string) => void]
      ];

      expect(() => handler!("order:status", "not-valid-json")).not.toThrow();
    });
  });

  describe("publishOrderStatus", () => {
    it("publishes the event as JSON to the order:status channel", async () => {
      const event = {
        orderId: "order-xyz",
        status: "paid",
        updatedAt: new Date().toISOString(),
      };

      await pubsub.publishOrderStatus(event);

      expect(pub.publish).toHaveBeenCalledWith(
        "order:status",
        JSON.stringify(event)
      );
    });
  });

  describe("stop", () => {
    it("unsubscribes from the order:status channel", async () => {
      await pubsub.stop();

      expect(sub.unsubscribe).toHaveBeenCalledWith("order:status");
    });

    it("removes all message listeners from the subscriber", async () => {
      await pubsub.stop();

      expect(sub.removeAllListeners).toHaveBeenCalledWith("message");
    });
  });
});
