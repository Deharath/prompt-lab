###############################################################################
# 1. BUILD STAGE – compile API and build web bundle                           #
###############################################################################
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

# full workspace
COPY . .

# install + build once (kept in a single layer for CI speed)
RUN pnpm install --frozen-lockfile \
  && pnpm --filter api  run build \
  && pnpm --filter web  run build

###############################################################################
# 2. RUNTIME STAGE – minimal image that only runs the API                     #
###############################################################################
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

RUN corepack enable && pnpm fetch --prod

#───────────────────────────────────────────────────────────────────────────────
# Copy manifest & lock-file so pnpm can do a prod-only install
#───────────────────────────────────────────────────────────────────────────────
COPY --from=builder /app/package.json           ./
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml         ./

RUN pnpm install --offline --prod

#───────────────────────────────────────────────────────────────────────────────
# Bring in compiled API artefacts + evaluator code required at runtime
#───────────────────────────────────────────────────────────────────────────────
COPY --from=builder /app/apps/api/dist            ./apps/api/dist
COPY --from=builder /app/packages/evaluator/src   ./packages/evaluator/src

# OPTIONAL: if you want to serve the static web bundle from this container
# COPY --from=builder /app/apps/web/dist           ./public

EXPOSE 3000
ENTRYPOINT ["node", "apps/api/dist/index.js"]
