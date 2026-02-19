import type Redis from "ioredis";
import type { SSEManager } from "./sse-manager.js";

const ORDER_CHANNEL = "order:status";

export interface OrderStatusEvent {
  orderId: string;
  status: string;
  updatedAt: string;
}

/**
 * Wraps Redis pub/sub to broadcast order status events across API instances.
 * The subscriber receives published messages and forwards them to connected
 * SSE clients via the SSEManager.
 */
export class RedisPubSub {
  constructor(
    private pub: Redis,
    private sub: Redis,
    private sseManager: SSEManager
  ) {}

  /**
   * Subscribe to the order status channel and route incoming messages
   * to the appropriate SSE connections.
   */
  async start(): Promise<void> {
    await this.sub.subscribe(ORDER_CHANNEL);

    this.sub.on("message", (channel: string, message: string) => {
      if (channel !== ORDER_CHANNEL) return;

      let event: OrderStatusEvent;
      try {
        event = JSON.parse(message) as OrderStatusEvent;
      } catch {
        // Malformed message — ignore silently to avoid crashing the process
        return;
      }

      this.sseManager.sendEvent(event.orderId, "status", event);
    });
  }

  /**
   * Publish an order status change to all subscribed API instances.
   */
  async publishOrderStatus(event: OrderStatusEvent): Promise<void> {
    await this.pub.publish(ORDER_CHANNEL, JSON.stringify(event));
  }

  /**
   * Unsubscribe from the order status channel and clean up listeners.
   */
  async stop(): Promise<void> {
    await this.sub.unsubscribe(ORDER_CHANNEL);
    this.sub.removeAllListeners("message");
  }
}
