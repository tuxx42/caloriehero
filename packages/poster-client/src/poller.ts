import type { PosterOrderStatus } from "@caloriehero/shared-types";
import type { PosterClient } from "./client.js";
import { IncomingOrdersEndpoint } from "./endpoints/incoming-orders.js";

// ---------------------------------------------------------------------------
// Internal state per watched order
// ---------------------------------------------------------------------------

interface WatchEntry {
  intervalId: ReturnType<typeof setInterval>;
  lastStatus: string | undefined;
  callback: (status: PosterOrderStatus) => void;
}

// ---------------------------------------------------------------------------
// Status normalisation
// ---------------------------------------------------------------------------

/**
 * Maps the raw Poster status string to a `PosterOrderStatus`.
 * Poster returns numeric status codes as strings; we accept both those
 * numeric strings and the human-readable values defined in shared-types.
 *
 * Poster status codes:
 *   1 → new
 *   2 → accepted
 *   3 → ready
 *   4 → closed
 */
function normalisePosterStatus(raw: string): PosterOrderStatus {
  switch (raw) {
    case "1":
    case "new":
      return "new";
    case "2":
    case "accepted":
      return "accepted";
    case "3":
    case "ready":
      return "ready";
    case "4":
    case "closed":
      return "closed";
    default:
      return "new";
  }
}

// ---------------------------------------------------------------------------
// PosterOrderPoller
// ---------------------------------------------------------------------------

/**
 * Polls Poster POS for order status changes and fires a callback whenever
 * the status of a watched order changes.
 *
 * Usage:
 * ```ts
 * const poller = new PosterOrderPoller(client, 30_000);
 * poller.watchOrder("123", (status) => console.log("status:", status));
 * // later...
 * poller.stopWatching("123");
 * ```
 */
export class PosterOrderPoller {
  private readonly orders = new Map<string, WatchEntry>();
  private readonly endpoint: IncomingOrdersEndpoint;
  private readonly intervalMs: number;

  constructor(
    client: PosterClient,
    intervalMs = 30_000,
    /** Injectable endpoint — used in tests to inject a mock */
    endpoint?: IncomingOrdersEndpoint
  ) {
    this.intervalMs = intervalMs;
    this.endpoint = endpoint ?? new IncomingOrdersEndpoint(client);
  }

  /**
   * Starts polling for the given order ID.
   * The callback is invoked with the new `PosterOrderStatus` each time the
   * status changes (including the first observed value).
   *
   * Calling `watchOrder` for an already-watched ID replaces the existing
   * watcher.
   */
  watchOrder(
    orderId: string,
    callback: (status: PosterOrderStatus) => void
  ): void {
    // Stop any existing watcher for this order before starting a new one
    this.stopWatching(orderId);

    const entry: WatchEntry = {
      intervalId: setInterval(() => {
        void this.poll(orderId);
      }, this.intervalMs),
      lastStatus: undefined,
      callback,
    };

    this.orders.set(orderId, entry);
  }

  /**
   * Stops polling for the given order ID.
   * Does nothing if the order is not currently being watched.
   */
  stopWatching(orderId: string): void {
    const entry = this.orders.get(orderId);
    if (entry !== undefined) {
      clearInterval(entry.intervalId);
      this.orders.delete(orderId);
    }
  }

  /**
   * Stops all active pollers.
   */
  stopAll(): void {
    // Snapshot the keys first to avoid mutation-during-iteration
    const orderIds = [...this.orders.keys()];
    for (const orderId of orderIds) {
      this.stopWatching(orderId);
    }
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private async poll(orderId: string): Promise<void> {
    const entry = this.orders.get(orderId);
    if (entry === undefined) return;

    try {
      const order = await this.endpoint.getIncomingOrder(orderId);
      const normalised = normalisePosterStatus(order.status);

      if (normalised !== entry.lastStatus) {
        entry.lastStatus = normalised;
        entry.callback(normalised);
      }
    } catch {
      // Silently swallow polling errors so a transient network issue does not
      // crash the interval loop. The next tick will retry automatically.
    }
  }
}
