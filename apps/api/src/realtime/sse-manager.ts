import type { FastifyReply } from "fastify";

export interface SSEConnection {
  reply: FastifyReply;
  userId: string;
  orderId: string;
}

/**
 * Manages SSE connections keyed by orderId.
 * Each orderId can have multiple active connections (e.g. user with multiple tabs).
 */
export class SSEManager {
  private connections: Map<string, SSEConnection[]> = new Map();

  /**
   * Register a new SSE connection for a given orderId.
   */
  addConnection(orderId: string, connection: SSEConnection): void {
    const existing = this.connections.get(orderId) ?? [];
    existing.push(connection);
    this.connections.set(orderId, existing);
  }

  /**
   * Remove a specific connection by matching the reply object reference.
   * Cleans up the map entry entirely if no connections remain.
   */
  removeConnection(orderId: string, reply: FastifyReply): void {
    const existing = this.connections.get(orderId);
    if (!existing) return;

    const filtered = existing.filter((conn) => conn.reply !== reply);

    if (filtered.length === 0) {
      this.connections.delete(orderId);
    } else {
      this.connections.set(orderId, filtered);
    }
  }

  /**
   * Send an SSE event to all connections watching the given orderId.
   * Uses the raw Node.js response to write the event directly.
   */
  sendEvent(orderId: string, event: string, data: unknown): void {
    const conns = this.connections.get(orderId);
    if (!conns || conns.length === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const conn of conns) {
      conn.reply.raw.write(payload);
    }
  }

  /**
   * Returns the number of active connections for a given orderId.
   */
  getConnectionCount(orderId: string): number {
    return this.connections.get(orderId)?.length ?? 0;
  }

  /**
   * Close and remove all tracked connections.
   */
  closeAll(): void {
    for (const conns of this.connections.values()) {
      for (const conn of conns) {
        conn.reply.raw.end();
      }
    }
    this.connections.clear();
  }
}
