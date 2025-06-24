    && pnpm --filter api --prod install \
    && pnpm --filter @prompt-lab/evaluator --prod install
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/evaluator/node_modules ./packages/evaluator/node_modules
###############################################################################
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable      # enables pnpm

# copy the entire repo
COPY . .

# install deps once (cached) and build every workspace that has a build script
RUN pnpm install --frozen-lockfile \
 && pnpm --filter api      run build \
 && pnpm --filter web      run build \
 && pnpm --filter "@prompt-lab/evaluator" run build

###############################################################################
# ❷ Runtime stage – slim image with only production artefacts
###############################################################################
FROM node:22-slim AS runner

WORKDIR /app
RUN corepack enable

# ── static assets & compiled bundles ─────────────────────────────────────────
COPY --from=builder /app/apps/web/dist            ./public
COPY --from=builder /app/apps/api/dist            ./apps/api/dist
COPY --from=builder /app/packages/evaluator/dist ./packages/evaluator/dist

# ── package-manager metadata & production node_modules ───────────────────────
COPY --from=builder /app/package.json \
                     /app/pnpm-lock.yaml \
                     /app/pnpm-workspace.yaml \
                     ./
COPY --from=builder /app/node_modules             ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

# start the API (entrypoint produced by tsc)
CMD ["node", "apps/api/dist/index.js"]
