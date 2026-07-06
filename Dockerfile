# syntax=docker/dockerfile:1

FROM node:22-slim AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN useradd --system --uid 1001 --create-home appuser

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/src/db ./src/db
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh && chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((r) => r.json().then((b) => process.exit(b.status === 'ok' ? 0 : 1))).catch(() => process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
