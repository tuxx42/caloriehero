import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    user: AuthUser | null;
  }
}

export interface AuthPluginOptions {
  jwtSecret?: string;
  mock?: boolean;
}

/**
 * Creates a mock JWT token for use in tests.
 * The token is just a base64-encoded JSON payload (not cryptographically signed).
 */
export function createMockToken(user: AuthUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

const realAuthPlugin: FastifyPluginAsync<AuthPluginOptions> = async (
  fastify,
  opts
) => {
  const secret = opts.jwtSecret;
  if (!secret) {
    throw new Error("jwtSecret is required for real auth plugin");
  }

  fastify.decorateRequest("user", null);

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return;
    }

    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, secret) as AuthUser;
      request.user = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        isAdmin: payload.isAdmin ?? false,
      };
    } catch {
      // Invalid token — leave request.user undefined; protected routes will reject
    }
  });
};

const mockAuthPlugin: FastifyPluginAsync<AuthPluginOptions> = async (
  fastify
) => {
  fastify.decorateRequest("user", null);

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return;
    }

    const token = authHeader.slice(7);
    try {
      // Attempt JSON parse first (raw JSON token)
      const payload = JSON.parse(token) as AuthUser;
      request.user = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        isAdmin: payload.isAdmin ?? false,
      };
    } catch {
      try {
        // Attempt base64-encoded JSON
        const decoded = Buffer.from(token, "base64").toString("utf8");
        const payload = JSON.parse(decoded) as AuthUser;
        request.user = {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          isAdmin: payload.isAdmin ?? false,
        };
      } catch {
        // Invalid token — leave request.user undefined
      }
    }
  });
};

export const authPlugin = fp(realAuthPlugin, {
  name: "auth",
  fastify: "5.x",
});

export const mockAuthPluginWrapped = fp(mockAuthPlugin, {
  name: "auth",
  fastify: "5.x",
});

/**
 * Signs a real JWT for use in integration tests against a real auth setup.
 */
export function signToken(user: AuthUser, secret: string): string {
  return jwt.sign(user, secret, { expiresIn: "1h" });
}
