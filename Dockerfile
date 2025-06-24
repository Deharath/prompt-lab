###############################################################################
# ❷ Runtime stage – slim image that only contains production artefacts
###############################################################################
FROM node:22-slim AS runner

WORKDIR /app
RUN corepack enable

# ── static assets & compiled JS ──────────────────────────────────────────────
COPY --from=builder /app/apps/web/dist          ./public
COPY --from=builder /app/apps/api/dist          ./apps/api/dist
COPY --from=builder /app/packages/evaluator/dist ./packages/evaluator/dist

# ── package-manager metadata & production node_modules ───────────────────────
COPY --from=builder /app/package.json \
                     /app/pnpm-lock.yaml \
                     /app/pnpm-workspace.yaml \
                     ./
COPY --from=builder /app/node_modules           ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

# ✔ point to *actual* entry file produced by the API build
CMD ["node", "apps/api/dist/index.js"]
