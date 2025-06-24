# ────────────────────────────── build stage ──────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable                             # enables pnpm

# Copy full repo for a monorepo build
COPY . .

# Install all deps and build both sub-apps
RUN pnpm install --frozen-lockfile \
 && pnpm --filter api run build \
 && pnpm --filter web run build

# ────────────────────────────── runtime stage ────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app
RUN corepack enable                             # enables pnpm

# ─ copy production assets from the builder image ─
COPY --from=builder /app/apps/web/dist  ./public
COPY --from=builder /app/apps/api/dist  ./apps/api/dist

# root package manager files for pnpm --prod install
COPY --from=builder /app/package.json        ./
COPY --from=builder /app/pnpm-lock.yaml      ./
COPY --from=builder /app/pnpm-workspace.yaml ./   # ignore-missing won’t be needed now

# prune dev-only deps.
RUN pnpm install --prod --frozen-lockfile

# Expose API port
EXPOSE 3000

# Start the compiled API (entrypoint lives in apps/api/dist/index.js)
CMD ["node", "apps/api/dist/index.js"]
