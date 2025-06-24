FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm build:api \
    && pnpm --filter web run build

FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY --from=builder /app/apps/web/dist ./public
COPY --from=builder /app/apps/api/dist ./dist
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --prod --frozen-lockfile
EXPOSE 3000
CMD ["node","dist/index.js"]
