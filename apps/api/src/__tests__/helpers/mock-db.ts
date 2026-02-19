import { vi } from "vitest";
import type { Database } from "../../db/index.js";

/**
 * Creates a mock Database object that can be used in tests.
 * Returns an object with the same shape as the Drizzle db, but all
 * methods are vi.fn() that can be configured per test.
 */
export function createMockDb(): Database {
  // We build a chainable query builder mock.
  // Each method returns "this" so you can chain .from().where().limit()
  // The terminal awaitable resolves to whatever you set via mockResolvedValue.
  const mockQueryChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = [
      "select",
      "from",
      "where",
      "limit",
      "insert",
      "values",
      "update",
      "set",
      "delete",
      "returning",
      "orderBy",
      "leftJoin",
      "innerJoin",
    ];
    for (const method of methods) {
      chain[method] = vi.fn(() => chain);
    }
    // Make it thenable so `await db.select()...` works
    chain["then"] = vi.fn((resolve: (val: unknown) => unknown) =>
      Promise.resolve([]).then(resolve)
    );
    return chain;
  };

  const chain = mockQueryChain();
  return chain as unknown as Database;
}

/**
 * A simpler approach: create individual vi.fn() methods on a plain object
 * shaped as the DB service functions expect. Since services call things like
 * `db.select().from(table).where(...)`, we need a chainable mock.
 */
export type MockDb = {
  _store: Map<string, unknown[]>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};
