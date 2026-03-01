FROM node:20-alpine AS base

# --- Install dependencies ---
FROM base AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

# --- Build the Next.js application ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .
RUN npm run build

# --- Production image ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone build (includes traced node_modules + Next.js runtime)
COPY --from=builder /app/.next/standalone ./
# Copy static assets into the standalone .next directory
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets
COPY --from=builder /app/public ./public
# Use our custom server (with Socket.IO) instead of the standalone default
COPY --from=builder /app/server.js ./server.js

# Install socket.io — standalone tracing doesn't pick it up from the custom server.js
RUN npm install socket.io@4

ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
