# ── Stage 1: Base ─────────────────────────────────────────────────────────────
# Shared base with Node.js + pnpm installed
FROM node:22-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ── Stage 2: Dependencies ──────────────────────────────────────────────────────
# Install all dependencies (including devDependencies) for building
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 3: Builder ───────────────────────────────────────────────────────────
# Compile TypeScript to JavaScript
FROM deps AS builder

COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Compile TypeScript
RUN pnpm build

# ── Stage 4: Production ────────────────────────────────────────────────────────
# Lean production image — only runtime dependencies
FROM base AS production

ENV NODE_ENV=production

WORKDIR /app

# Copy package manifests and install only production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and generated client (needed at runtime for migrations)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

# Copy prisma config for migration runner
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 foodflow \
 && chown -R foodflow:nodejs /app

USER foodflow

EXPOSE 3000

# Health check — poll the liveness endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health/live || exit 1

CMD ["node", "dist/server.js"]
