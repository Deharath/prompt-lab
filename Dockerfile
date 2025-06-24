###############################################################################
# ── ❶ Build stage ──────────────────────────────────────────────────────────── #
# Uses Alpine to keep the build container tiny.
###############################################################################
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable                         # enables pnpm

# copy *everything* the build needs
COPY . .

# install full workspace deps & build both sub-apps in one shot
RUN pnpm install --frozen-lockfile \
 && pnpm --filter api  run build            \
 && pnpm --filter web  run build

###############################################################################
# ── ❷ Runtime stage ───────────────────────────────────────────────────────── #
# Slim image + only production bits → small and fast.
###############################################################################
FROM node:22-slim AS runner

WORKDIR /app
RUN corepack enable

# ── copy runtime artefacts ───────────────────────────────────────────────────
# compiled JS bundles
COPY --from=builder /app/apps/web/dist  ./public
COPY --from=builder /app/apps/api/dist  ./dist

# package manager files
COPY --from=builder /app/package.json \
                     /app/pnpm-lock.yaml \
                     /app/pnpm-workspace.yaml \
                     ./

# production-only node_modules (already prepared by the builder)
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
