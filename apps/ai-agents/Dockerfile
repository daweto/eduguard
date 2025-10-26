FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@latest

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

# Copy workspace and package files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy packages (for workspace dependencies)
COPY packages ./packages

# Copy ai-agents app
COPY apps/ai-agents ./apps/ai-agents

# Install dependencies
RUN pnpm install --frozen-lockfile --filter ai-agents...

# Build the app
RUN pnpm --filter ai-agents build

# Prune dev dependencies
RUN pnpm --filter ai-agents --prod deploy /app/pruned

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# Copy production dependencies and build output
COPY --from=builder --chown=hono:nodejs /app/pruned/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/apps/ai-agents/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/apps/ai-agents/package.json /app/package.json

USER hono

# Expose port (Cloudflare will map this)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "/app/dist/index.js"]
