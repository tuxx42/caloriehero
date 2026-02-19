import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyReply } from "fastify";
import { SSEManager } from "../../realtime/sse-manager.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockReply() {
  return {
    raw: {
      write: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
    },
  } as unknown as FastifyReply;
}

const ORDER_ID = "order-001";
const USER_ID = "user-001";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SSEManager", () => {
  let manager: SSEManager;

  beforeEach(() => {
    manager = new SSEManager();
  });

  describe("addConnection / getConnectionCount", () => {
    it("starts with zero connections for an unknown orderId", () => {
      expect(manager.getConnectionCount(ORDER_ID)).toBe(0);
    });

    it("returns 1 after adding a single connection", () => {
      const reply = createMockReply();
      manager.addConnection(ORDER_ID, { reply, userId: USER_ID, orderId: ORDER_ID });

      expect(manager.getConnectionCount(ORDER_ID)).toBe(1);
    });

    it("returns 2 after adding two connections for the same orderId", () => {
      manager.addConnection(ORDER_ID, {
        reply: createMockReply(),
        userId: USER_ID,
        orderId: ORDER_ID,
      });
      manager.addConnection(ORDER_ID, {
        reply: createMockReply(),
        userId: USER_ID,
        orderId: ORDER_ID,
      });

      expect(manager.getConnectionCount(ORDER_ID)).toBe(2);
    });
  });

  describe("removeConnection", () => {
    it("removes a specific connection by reply reference", () => {
      const reply1 = createMockReply();
      const reply2 = createMockReply();

      manager.addConnection(ORDER_ID, { reply: reply1, userId: USER_ID, orderId: ORDER_ID });
      manager.addConnection(ORDER_ID, { reply: reply2, userId: USER_ID, orderId: ORDER_ID });

      manager.removeConnection(ORDER_ID, reply1);

      expect(manager.getConnectionCount(ORDER_ID)).toBe(1);
    });

    it("drops the orderId entry when the last connection is removed", () => {
      const reply = createMockReply();
      manager.addConnection(ORDER_ID, { reply, userId: USER_ID, orderId: ORDER_ID });
      manager.removeConnection(ORDER_ID, reply);

      expect(manager.getConnectionCount(ORDER_ID)).toBe(0);
    });

    it("does nothing when removing from an unknown orderId", () => {
      // Should not throw
      expect(() =>
        manager.removeConnection("non-existent-order", createMockReply())
      ).not.toThrow();
    });
  });

  describe("sendEvent", () => {
    it("writes a correctly-formatted SSE payload to the connection", () => {
      const reply = createMockReply();
      manager.addConnection(ORDER_ID, { reply, userId: USER_ID, orderId: ORDER_ID });

      manager.sendEvent(ORDER_ID, "status", { orderId: ORDER_ID, status: "paid" });

      expect(reply.raw.write).toHaveBeenCalledOnce();
      const written = (reply.raw.write as ReturnType<typeof vi.fn>).mock
        .calls[0]![0] as string;
      expect(written).toContain("event: status\n");
      expect(written).toContain(`"orderId":"${ORDER_ID}"`);
      expect(written).toContain(`"status":"paid"`);
      expect(written.endsWith("\n\n")).toBe(true);
    });

    it("sends to all connections watching the same orderId", () => {
      const reply1 = createMockReply();
      const reply2 = createMockReply();

      manager.addConnection(ORDER_ID, { reply: reply1, userId: USER_ID, orderId: ORDER_ID });
      manager.addConnection(ORDER_ID, { reply: reply2, userId: USER_ID, orderId: ORDER_ID });

      manager.sendEvent(ORDER_ID, "status", { status: "processing" });

      expect(reply1.raw.write).toHaveBeenCalledOnce();
      expect(reply2.raw.write).toHaveBeenCalledOnce();
    });

    it("does not throw when sending to an orderId with no connections", () => {
      expect(() =>
        manager.sendEvent("empty-order", "status", { status: "paid" })
      ).not.toThrow();
    });
  });

  describe("closeAll", () => {
    it("calls end() on all connections and clears the map", () => {
      const reply1 = createMockReply();
      const reply2 = createMockReply();

      manager.addConnection(ORDER_ID, { reply: reply1, userId: USER_ID, orderId: ORDER_ID });
      manager.addConnection("order-002", {
        reply: reply2,
        userId: USER_ID,
        orderId: "order-002",
      });

      manager.closeAll();

      expect(reply1.raw.end).toHaveBeenCalledOnce();
      expect(reply2.raw.end).toHaveBeenCalledOnce();
      expect(manager.getConnectionCount(ORDER_ID)).toBe(0);
      expect(manager.getConnectionCount("order-002")).toBe(0);
    });
  });
});
