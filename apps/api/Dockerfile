# ── Build stage ──
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy package.json for all packages (for install)
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/meal-plan-engine/package.json packages/meal-plan-engine/
COPY packages/poster-client/package.json packages/poster-client/

# Install deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared-types/ packages/shared-types/
COPY packages/meal-plan-engine/ packages/meal-plan-engine/
COPY packages/poster-client/ packages/poster-client/
COPY apps/api/ apps/api/

# Build
RUN pnpm turbo build --filter=@caloriehero/api

# ── Production stage ──
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/meal-plan-engine/package.json packages/meal-plan-engine/
COPY packages/poster-client/package.json packages/poster-client/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared-types/dist/ packages/shared-types/dist/
COPY --from=builder /app/packages/meal-plan-engine/dist/ packages/meal-plan-engine/dist/
COPY --from=builder /app/packages/poster-client/dist/ packages/poster-client/dist/
COPY --from=builder /app/apps/api/dist/ apps/api/dist/

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
