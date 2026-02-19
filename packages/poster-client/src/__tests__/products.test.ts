import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProductsEndpoint } from "../endpoints/products.js";
import { PosterClient } from "../client.js";
import type { PosterProduct } from "@caloriehero/shared-types";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProductsEndpoint", () => {
  const getMock = vi.fn();

  let endpoint: ProductsEndpoint;

  beforeEach(() => {
    const fakeClient = { get: getMock } as unknown as PosterClient;
    endpoint = new ProductsEndpoint(fakeClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a list of mapped PosterProducts", async () => {
    const raw = {
      response: [
        { product_id: "1", product_name: "Chicken Bowl", price: "15000", menu_category_id: "5" },
        { product_id: "2", product_name: "Beef Burger", price: "18000", menu_category_id: "5" },
      ],
    };
    getMock.mockResolvedValueOnce(raw);

    const result = await endpoint.getProducts();

    expect(getMock).toHaveBeenCalledWith("/menu.getProducts");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject<PosterProduct>({
      productId: "1",
      name: "Chicken Bowl",
      price: 15000,
      categoryId: "5",
    });
    expect(result[1]).toMatchObject<PosterProduct>({
      productId: "2",
      name: "Beef Burger",
      price: 18000,
      categoryId: "5",
    });
  });

  it("returns empty array when product list is empty", async () => {
    getMock.mockResolvedValueOnce({ response: [] });

    const result = await endpoint.getProducts();

    expect(result).toEqual([]);
  });

  it("handles products without a category ID", async () => {
    const raw = {
      response: [
        { product_id: "10", product_name: "Water", price: "500" },
      ],
    };
    getMock.mockResolvedValueOnce(raw);

    const result = await endpoint.getProducts();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<PosterProduct>({
      productId: "10",
      name: "Water",
      price: 500,
    });
    expect(result[0]!.categoryId).toBeUndefined();
  });
});
