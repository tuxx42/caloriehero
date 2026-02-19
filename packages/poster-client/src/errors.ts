/**
 * Error thrown by PosterClient when the Poster POS API returns a non-2xx
 * HTTP response.
 */
export class PosterApiError extends Error {
  readonly statusCode: number;
  readonly responseBody: unknown;

  constructor(message: string, statusCode: number, responseBody: unknown) {
    super(message);
    this.name = "PosterApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}
