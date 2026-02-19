import type Redis from "ioredis";
import type { Readable } from "stream";

const MEALS_CACHE_KEY = "meals:active";
const DELIVERY_SLOTS_PREFIX = "delivery:slots";

/**
 * Redis-backed cache service with TTL support.
 * Provides typed get/set helpers and convenience methods for
 * frequently-accessed domain data (meals, delivery slots).
 */
export class CacheService {
  constructor(
    private redis: Redis,
    private defaultTtl = 300 // 5 minutes
  ) {}

  /**
   * Retrieve a cached value by key.
   * Returns null on cache miss or if the stored value is not valid JSON.
   */
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw === null) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Store a value in Redis with an optional TTL (seconds).
   * Falls back to defaultTtl when ttl is not provided.
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const expirySeconds = ttl ?? this.defaultTtl;
    await this.redis.setex(key, expirySeconds, JSON.stringify(value));
  }

  /**
   * Delete a single key from the cache.
   */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Delete all keys matching a glob pattern using SCAN to avoid blocking Redis.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({ match: pattern }) as Readable;

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (keys: string[]) => {
        if (keys.length > 0) {
          // Fire-and-forget individual deletes; any error is non-fatal
          this.redis.del(...keys).catch(() => undefined);
        }
      });

      stream.on("end", () => resolve());
      stream.on("error", (err: Error) => reject(err));
    });
  }

  // ---------------------------------------------------------------------------
  // Convenience methods
  // ---------------------------------------------------------------------------

  /** Get the active meals list from cache. */
  async getMeals(): Promise<unknown[] | null> {
    return this.get<unknown[]>(MEALS_CACHE_KEY);
  }

  /** Cache the active meals list with a short 1-minute TTL. */
  async setMeals(meals: unknown[]): Promise<void> {
    await this.set(MEALS_CACHE_KEY, meals, 60);
  }

  /** Get delivery slots for a zone/date pair from cache. */
  async getDeliverySlots(
    zoneId: string,
    date: string
  ): Promise<unknown[] | null> {
    return this.get<unknown[]>(`${DELIVERY_SLOTS_PREFIX}:${zoneId}:${date}`);
  }

  /** Cache delivery slots for a zone/date pair with the default TTL. */
  async setDeliverySlots(
    zoneId: string,
    date: string,
    slots: unknown[]
  ): Promise<void> {
    await this.set(
      `${DELIVERY_SLOTS_PREFIX}:${zoneId}:${date}`,
      slots,
      this.defaultTtl
    );
  }

  /** Invalidate all cached meal data. */
  async invalidateMeals(): Promise<void> {
    await this.del(MEALS_CACHE_KEY);
  }

  /** Invalidate all delivery slot entries for a given zone. */
  async invalidateDeliverySlots(zoneId: string): Promise<void> {
    await this.invalidatePattern(
      `${DELIVERY_SLOTS_PREFIX}:${zoneId}:*`
    );
  }
}
