###############################################################################
# 1. BUILD STAGE – compile API (and web bundle so we keep the old behaviour)  #
###############################################################################
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

# full monorepo context
COPY . .

# install once – uses the lock-file that’s already in the repo
RUN pnpm install --frozen-lockfile \
  && pnpm --filter api run build \
  && pnpm --filter web run build   # ← still produces the static web bundle

###############################################################################
# 2. RUNTIME STAGE – only what we actually need to run the API                #
###############################################################################
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

RUN corepack enable && pnpm fetch --prod

# ── production dependencies only ────────────────────────────────────────────
COPY --from=builder /app/pnpm-lock.yaml ./
RUN pnpm install --offline --prod

# ── compiled API + evaluator sources (needed at runtime) ────────────────────
COPY --from=builder /app/apps/api/dist            ./apps/api/dist
COPY --from=builder /app/packages/evaluator/src   ./packages/evaluator/src

# ── optional: serve the built web bundle from /public using any static host ─
# COPY --from=builder /app/apps/web/dist           ./public

EXPOSE 3000
ENTRYPOINT ["node", "apps/api/dist/index.js"]
