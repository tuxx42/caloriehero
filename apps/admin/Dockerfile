# ── Build stage ──
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/
COPY packages/shared-types/package.json packages/shared-types/

RUN pnpm install --frozen-lockfile

COPY packages/shared-types/ packages/shared-types/
COPY apps/admin/ apps/admin/

RUN pnpm turbo build --filter=@caloriehero/admin

# ── Production stage ──
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static apps/admin/.next/static
COPY --from=builder /app/apps/admin/public apps/admin/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/admin/server.js"]
