FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable      # enables pnpm

# copy the entire repo
COPY . .

# install deps once (cached) and build every workspace that has a build script
RUN pnpm install --frozen-lockfile \
    && pnpm -r build

###############################################################################
# ❷ Runtime stage – slim image with only production artefacts
###############################################################################
FROM node:22-slim AS runner

WORKDIR /app
RUN corepack enable

# ── static assets & compiled bundles ─────────────────────────────────────────
COPY --from=builder /app/apps/web/dist            ./public
COPY --from=builder /app/apps/api/dist            ./apps/api/dist
COPY --from=builder /app/packages/evaluation-engine/dist        ./packages/evaluation-engine/dist
COPY --from=builder /app/packages/shared-types/dist           ./packages/shared-types/dist
# ── migration files for database setup ──────────────────────────────────────
COPY --from=builder /app/packages/evaluation-engine/drizzle    ./packages/evaluation-engine/drizzle/
# Ensure migration files have proper permissions
RUN ls -la ./packages/evaluation-engine/drizzle/migrations/ || echo "Migration files not found after copy"
# ── package-manager metadata & production deps ───────────────────────────────
COPY --from=builder /app/package.json \
                     /app/pnpm-lock.yaml \
                     /app/pnpm-workspace.yaml \
                     ./
COPY --from=builder /app/apps/api/package.json   ./apps/api/package.json
COPY --from=builder /app/packages/evaluation-engine/package.json ./packages/evaluation-engine/package.json
COPY --from=builder /app/packages/shared-types/package.json       ./packages/shared-types/package.json
# install all dependencies for CI/dev (including devDependencies for lint/test)
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
RUN mkdir -p /app/db
EXPOSE 3000

# start the API (entrypoint produced by tsc)
CMD ["node", "apps/api/dist/src/index.js"]
