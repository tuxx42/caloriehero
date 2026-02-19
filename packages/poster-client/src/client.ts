import { PosterApiError } from "./errors.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PosterClientOptions {
  /** Base URL of the Poster POS API — e.g. "https://joinposter.com/api" */
  apiUrl: string;
  /** Poster access token appended as `?token=` to every request */
  accessToken: string;
}

export interface GetOptions {
  /** Additional query string parameters to include in the request URL */
  params?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
/** Initial backoff delay in milliseconds; doubles on each retry */
const INITIAL_BACKOFF_MS = 100;

// ---------------------------------------------------------------------------
// PosterClient
// ---------------------------------------------------------------------------

/**
 * Thin HTTP client for the Poster POS API v3.
 *
 * - Authenticates every request with `?token=<accessToken>`
 * - Retries on 5xx errors with exponential backoff (max 3 retries)
 * - Throws `PosterApiError` on non-2xx responses (after retries exhausted)
 */
export class PosterClient {
  private readonly apiUrl: string;
  private readonly accessToken: string;

  constructor(options: PosterClientOptions) {
    this.apiUrl = options.apiUrl.replace(/\/$/, "");
    this.accessToken = options.accessToken;
  }

  // -------------------------------------------------------------------------
  // Public methods
  // -------------------------------------------------------------------------

  async get<T>(path: string, options: GetOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params);
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildUrl(path: string, extra: Record<string, string> = {}): string {
    const params = new URLSearchParams({ token: this.accessToken, ...extra });
    const normalised = path.startsWith("/") ? path : `/${path}`;
    return `${this.apiUrl}${normalised}?${params.toString()}`;
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    let lastError: PosterApiError | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
      }

      const response = await fetch(url, init);

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      const responseBody: unknown = await response.json().catch(() => null);
      const error = new PosterApiError(
        `Poster API error: ${response.status}`,
        response.status,
        responseBody
      );

      // Do not retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw error;
      }

      lastError = error;
    }

    // All retries exhausted for 5xx errors
    throw lastError!;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates and returns a new `PosterClient` instance.
 * This is the recommended entry point for consuming code.
 */
export function createPosterClient(options: PosterClientOptions): PosterClient {
  return new PosterClient(options);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
