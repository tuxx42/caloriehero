import type { PosterProduct } from "@caloriehero/shared-types";
import type { PosterClient } from "../client.js";

// ---------------------------------------------------------------------------
// Poster API wire format
// ---------------------------------------------------------------------------

interface RawProduct {
  product_id: string;
  product_name: string;
  /** Price as returned by Poster — may be a number or numeric string */
  price: number | string;
  menu_category_id?: string;
}

interface GetProductsResponse {
  response: RawProduct[];
}

// ---------------------------------------------------------------------------
// Endpoint class
// ---------------------------------------------------------------------------

export class ProductsEndpoint {
  constructor(private readonly client: PosterClient) {}

  /**
   * Fetches the full product menu from Poster POS.
   */
  async getProducts(): Promise<PosterProduct[]> {
    const response = await this.client.get<GetProductsResponse>(
      "/menu.getProducts"
    );

    return response.response.map((raw): PosterProduct => {
      const product: PosterProduct = {
        productId: raw.product_id,
        name: raw.product_name,
        price: Number(raw.price),
      };

      if (raw.menu_category_id !== undefined && raw.menu_category_id !== "") {
        product.categoryId = raw.menu_category_id;
      }

      return product;
    });
  }
}
