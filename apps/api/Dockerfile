FROM node:24-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/config-typescript/package.json packages/config-typescript/
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY packages/editorial/package.json packages/editorial/
COPY packages/project-management/package.json packages/project-management/
COPY packages/publishing/package.json packages/publishing/
COPY packages/infrastructure/package.json packages/infrastructure/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts --filter @marketing-service/api...

FROM deps AS build
WORKDIR /app
COPY packages/config-typescript packages/config-typescript
COPY packages/shared packages/shared
COPY packages/database packages/database
COPY packages/editorial packages/editorial
COPY packages/project-management packages/project-management
COPY packages/publishing packages/publishing
COPY packages/infrastructure packages/infrastructure
COPY apps/api apps/api
ENV NODE_ENV=production
RUN pnpm --filter @marketing-service/api... build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm deploy --filter @marketing-service/api --prod --legacy /deploy

FROM base AS production
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --shell /bin/sh --create-home nodejs
WORKDIR /app
COPY --from=build --chown=nodejs:nodejs /deploy/node_modules node_modules
COPY --from=build --chown=nodejs:nodejs /deploy/package.json package.json
COPY --from=build --chown=nodejs:nodejs /app/apps/api/dist dist
COPY --from=build --chown=nodejs:nodejs /app/packages/database/drizzle migrations

ARG GIT_SHA=unknown
LABEL org.opencontainers.image.source="https://github.com/ovnstable/ai-marketing-service" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.licenses="UNLICENSED" \
      org.opencontainers.image.title="marketing-api"

ENV NODE_ENV=production
ENV BUILD_SHA=${GIT_SHA}
ENV MIGRATIONS_FOLDER=/app/migrations
ENV PORT=3000

USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node --input-type=module -e "import('node:net').then(({ default: net }) => { const s = net.createConnection(3000, '127.0.0.1'); s.on('connect', () => { s.end(); process.exit(0); }); s.on('error', () => process.exit(1)); })"
CMD ["node", "--enable-source-maps", "dist/src/main.js"]
