###############################################################################
# ❶ Builder stage – installs full deps, compiles API + web + evaluator
###############################################################################
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable                    # enables pnpm

# copy the whole repo ( Docker ignore keeps node_modules/test files out )
COPY . .

# install once, then build the three workspaces
RUN pnpm install --frozen-lockfile \
 && pnpm --filter @prompt-lab/evaluator run build \
 && pnpm --filter api                run build \
 && pnpm --filter web                run build \
 # strip dev deps from the final node_modules tree
 && pnpm prune --prod

###############################################################################
# ❷ Runtime stage – slim image with only production artefacts
###############################################################################
FROM node:22-slim AS runner

WORKDIR /app
RUN corepack enable

# ── compiled JS + static assets ──────────────────────────────────────────────
COPY --from=builder /app/apps/web/dist         ./public
COPY --from=builder /app/apps/api/dist         ./dist
COPY --from=builder /app/packages/evaluator/dist ./packages/evaluator/dist

# ── package-manager metadata & production node_modules ───────────────────────
COPY --from=builder /app/package.json \
                     /app/pnpm-lock.yaml \
                     /app/pnpm-workspace.yaml \
                     ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

# main entry point (compiled API)
CMD ["node", "dist/index.js"]
