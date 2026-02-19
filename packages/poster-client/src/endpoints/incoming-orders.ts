import type { PosterOrder } from "@caloriehero/shared-types";
import type { PosterClient } from "../client.js";

// ---------------------------------------------------------------------------
// Types for the Poster API wire format
// ---------------------------------------------------------------------------

interface RawProduct {
  product_id: string;
  count: number;
  price: number;
}

interface RawOrder {
  incoming_order_id: string;
  status: string;
  products: RawProduct[];
}

interface CreateOrderResponse {
  response: {
    incoming_order_id: number | string;
  };
}

interface GetOrderResponse {
  response: RawOrder;
}

interface GetOrdersResponse {
  response: RawOrder[];
}

// ---------------------------------------------------------------------------
// Public param types
// ---------------------------------------------------------------------------

export interface CreateIncomingOrderParams {
  products: Array<{ productId: string; count: number }>;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  comment?: string;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapOrder(raw: RawOrder): PosterOrder {
  return {
    incomingOrderId: String(raw.incoming_order_id),
    status: raw.status,
    products: raw.products.map((p) => ({
      productId: p.product_id,
      count: p.count,
      price: p.price,
    })),
  };
}

// ---------------------------------------------------------------------------
// Endpoint class
// ---------------------------------------------------------------------------

export class IncomingOrdersEndpoint {
  constructor(private readonly client: PosterClient) {}

  /**
   * Creates a new incoming order in Poster POS.
   * Returns the Poster-assigned `incomingOrderId`.
   */
  async createIncomingOrder(
    params: CreateIncomingOrderParams
  ): Promise<{ incomingOrderId: string }> {
    const body: Record<string, unknown> = {
      products: params.products.map((p) => ({
        product_id: p.productId,
        count: p.count,
      })),
    };

    const clientInfo: Record<string, string> = {};
    if (params.firstName !== undefined) clientInfo["firstname"] = params.firstName;
    if (params.lastName !== undefined) clientInfo["lastname"] = params.lastName;
    if (params.phone !== undefined) clientInfo["phone"] = params.phone;
    if (Object.keys(clientInfo).length > 0) body["client"] = clientInfo;

    if (params.address !== undefined) body["address"] = { address1: params.address };
    if (params.comment !== undefined) body["comment"] = params.comment;

    const response = await this.client.post<CreateOrderResponse>(
      "/incomingOrders.createIncomingOrder",
      body
    );

    return {
      incomingOrderId: String(response.response.incoming_order_id),
    };
  }

  /**
   * Fetches a single incoming order by its Poster ID.
   */
  async getIncomingOrder(id: string): Promise<PosterOrder> {
    const response = await this.client.get<GetOrderResponse>(
      "/incomingOrders.getIncomingOrder",
      { params: { incoming_order_id: id } }
    );

    return mapOrder(response.response);
  }

  /**
   * Fetches all incoming orders from Poster POS.
   */
  async getIncomingOrders(): Promise<PosterOrder[]> {
    const response = await this.client.get<GetOrdersResponse>(
      "/incomingOrders.getIncomingOrders"
    );

    return response.response.map(mapOrder);
  }
}
