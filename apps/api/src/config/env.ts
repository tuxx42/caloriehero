import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  POSTER_API_URL: z.string().default("https://joinposter.com/api"),
  POSTER_ACCESS_TOKEN: z.string().optional(),
  POSTER_POLL_INTERVAL_MS: z.coerce.number().default(30000),
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Validate that Google credentials are present in production
const envWithRefinement = envSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV === "production") {
    if (!data.GOOGLE_CLIENT_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GOOGLE_CLIENT_ID is required in production",
        path: ["GOOGLE_CLIENT_ID"],
      });
    }
    if (!data.GOOGLE_CLIENT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GOOGLE_CLIENT_SECRET is required in production",
        path: ["GOOGLE_CLIENT_SECRET"],
      });
    }
    if (!data.STRIPE_SECRET_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "STRIPE_SECRET_KEY is required in production",
        path: ["STRIPE_SECRET_KEY"],
      });
    }
    if (!data.STRIPE_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "STRIPE_WEBHOOK_SECRET is required in production",
        path: ["STRIPE_WEBHOOK_SECRET"],
      });
    }
    if (!data.POSTER_ACCESS_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "POSTER_ACCESS_TOKEN is required in production",
        path: ["POSTER_ACCESS_TOKEN"],
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(env: NodeJS.ProcessEnv = process.env): Env {
  return envWithRefinement.parse(env);
}
