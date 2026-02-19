import { describe, it, expect, vi, beforeEach } from "vitest";
import type Redis from "ioredis";
import { EventEmitter } from "events";
import { CacheService } from "../../services/cache-service.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock Redis client backed by an in-memory Map.
 * The scanStream mock returns a Readable-like EventEmitter that emits
 * a single batch of matching keys then ends.
 */
function createMockRedis(initialStore: Map<string, string> = new Map()) {
  const store = initialStore;

  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setex: vi.fn((key: string, _ttl: number, val: string) => {
      store.set(key, val);
      return Promise.resolve("OK");
    }),
    del: vi.fn((...keys: string[]) => {
      for (const key of keys) store.delete(key);
      return Promise.resolve(keys.length);
    }),
    scanStream: vi.fn((opts: { match: string }) => {
      const emitter = new EventEmitter();
      // Collect matching keys synchronously then schedule emit
      const matching = [...store.keys()].filter((k) =>
        matchGlob(k, opts.match)
      );
      // Emit on next tick so consumers have time to register handlers
      setImmediate(() => {
        emitter.emit("data", matching);
        emitter.emit("end");
      });
      return emitter;
    }),
    _store: store,
  } as unknown as Redis & { _store: Map<string, string> };
}

/**
 * Minimal glob matcher that handles trailing `*` wildcard only.
 * e.g. "delivery:slots:zone1:*" matches "delivery:slots:zone1:2024-01-01"
 */
function matchGlob(key: string, pattern: string): boolean {
  if (pattern.endsWith("*")) {
    return key.startsWith(pattern.slice(0, -1));
  }
  return key === pattern;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CacheService", () => {
  let redis: ReturnType<typeof createMockRedis>;
  let cache: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    redis = createMockRedis();
    cache = new CacheService(redis as unknown as Redis);
  });

  describe("get", () => {
    it("returns null on cache miss", async () => {
      const result = await cache.get("missing-key");
      expect(result).toBeNull();
    });

    it("returns the parsed value on cache hit", async () => {
      (redis._store as Map<string, string>).set("my-key", JSON.stringify({ hello: "world" }));

      const result = await cache.get<{ hello: string }>("my-key");
      expect(result).toEqual({ hello: "world" });
    });

    it("returns null when the stored value is not valid JSON", async () => {
      (redis._store as Map<string, string>).set("bad-key", "not-json");

      const result = await cache.get("bad-key");
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("stores the value using setex with the provided TTL", async () => {
      await cache.set("my-key", { foo: 42 }, 120);

      expect(redis.setex).toHaveBeenCalledWith("my-key", 120, JSON.stringify({ foo: 42 }));
    });

    it("uses the default TTL (300s) when none is provided", async () => {
      await cache.set("my-key", { foo: 42 });

      expect(redis.setex).toHaveBeenCalledWith("my-key", 300, expect.any(String));
    });
  });

  describe("del", () => {
    it("deletes the key from the store", async () => {
      (redis._store as Map<string, string>).set("to-delete", "value");

      await cache.del("to-delete");

      expect(redis.del).toHaveBeenCalledWith("to-delete");
      expect((redis._store as Map<string, string>).has("to-delete")).toBe(false);
    });
  });

  describe("invalidatePattern", () => {
    it("deletes all keys matching the pattern", async () => {
      const store = redis._store as Map<string, string>;
      store.set("delivery:slots:zone1:2024-01-01", "a");
      store.set("delivery:slots:zone1:2024-01-02", "b");
      store.set("delivery:slots:zone2:2024-01-01", "c");

      await cache.invalidatePattern("delivery:slots:zone1:*");

      expect(store.has("delivery:slots:zone1:2024-01-01")).toBe(false);
      expect(store.has("delivery:slots:zone1:2024-01-02")).toBe(false);
      // zone2 should be untouched
      expect(store.has("delivery:slots:zone2:2024-01-01")).toBe(true);
    });

    it("does not throw when no keys match the pattern", async () => {
      await expect(
        cache.invalidatePattern("non-existent:*")
      ).resolves.not.toThrow();
    });
  });

  describe("getMeals / setMeals", () => {
    it("returns null before any meals are cached", async () => {
      expect(await cache.getMeals()).toBeNull();
    });

    it("round-trips meal data through the cache with 1-minute TTL", async () => {
      const meals = [{ id: "m1", name: "Chicken" }];
      await cache.setMeals(meals);

      expect(redis.setex).toHaveBeenCalledWith(
        "meals:active",
        60,
        JSON.stringify(meals)
      );

      const result = await cache.getMeals();
      expect(result).toEqual(meals);
    });
  });

  describe("getDeliverySlots / setDeliverySlots", () => {
    it("returns null before any slots are cached", async () => {
      expect(await cache.getDeliverySlots("zone1", "2024-01-01")).toBeNull();
    });

    it("stores and retrieves slots keyed by zone and date", async () => {
      const slots = [{ slotId: "s1", time: "12:00" }];
      await cache.setDeliverySlots("zone1", "2024-01-01", slots);

      const result = await cache.getDeliverySlots("zone1", "2024-01-01");
      expect(result).toEqual(slots);
    });
  });

  describe("invalidateMeals", () => {
    it("removes the meals:active key", async () => {
      (redis._store as Map<string, string>).set("meals:active", "[]");

      await cache.invalidateMeals();

      expect(redis.del).toHaveBeenCalledWith("meals:active");
    });
  });

  describe("invalidateDeliverySlots", () => {
    it("removes all slot keys for the given zone", async () => {
      const store = redis._store as Map<string, string>;
      store.set("delivery:slots:zone1:2024-01-01", "a");
      store.set("delivery:slots:zone1:2024-01-02", "b");
      store.set("delivery:slots:zone2:2024-01-01", "c");

      await cache.invalidateDeliverySlots("zone1");

      expect(store.has("delivery:slots:zone1:2024-01-01")).toBe(false);
      expect(store.has("delivery:slots:zone1:2024-01-02")).toBe(false);
      expect(store.has("delivery:slots:zone2:2024-01-01")).toBe(true);
    });
  });
});
