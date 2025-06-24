########################################################################
# 1.  BUILD STAGE  – compile the API and build the web bundle          #
########################################################################
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

# full workspace
COPY . .
RUN pnpm install --frozen-lockfile \
  && pnpm --filter api  run build \
  && pnpm --filter web  run build

########################################################################
# 2.  RUNTIME STAGE – minimal image; performs an *offline* prod install#
########################################################################
FROM node:22-slim AS runner

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app
RUN corepack enable

# ──────────────── 1. copy manifests first ─────────────────────────────
COPY --from=builder /app/package.json           ./
COPY --from=builder /app/pnpm-workspace.yaml    ./       # ok if absent
COPY --from=builder /app/pnpm-lock.yaml         ./

# ──────────────── 2. pre-fetch prod deps into the local store ─────────
RUN pnpm fetch --prod

# ──────────────── 3. *now* offline-install from that store ────────────
RUN pnpm install --offline --prod

# ──────────────── 4. copy compiled artefacts ──────────────────────────
COPY --from=builder /app/apps/api/dist            ./apps/api/dist
COPY --from=builder /app/packages/evaluator/src   ./packages/evaluator/src
# (Optionally serve the static web bundle)
# COPY --from=builder /app/apps/web/dist            ./public

EXPOSE 3000
ENTRYPOINT ["node", "apps/api/dist/index.js"]
