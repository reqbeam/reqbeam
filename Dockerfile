# Multi-stage build for Postmind Web App and Database Package

# Stage 1: Build postmind-db package
FROM node:18-alpine AS db-builder

WORKDIR /app/postmind-db

# Install OpenSSL for Prisma (required for Alpine Linux)
RUN apk add --no-cache openssl openssl-dev

# Install Prisma CLI globally for generating client
RUN npm install -g prisma@^5.22.0

# Copy postmind-db package files
COPY postmind-db/package*.json ./
COPY postmind-db/tsconfig.json ./
COPY postmind-db/prisma ./prisma
COPY postmind-db/src ./src

# Install dependencies
RUN npm ci

# Generate Prisma client with Alpine Linux binary target
# Note: We don't run db:push here - database will be created at runtime
ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build TypeScript
RUN npm run build

# Stage 2: Build Next.js application
FROM node:18-alpine AS next-builder

WORKDIR /app

# Install OpenSSL for Prisma (required for Alpine Linux)
RUN apk add --no-cache openssl openssl-dev

# Install Prisma CLI
RUN npm install -g prisma@^5.22.0

# Copy package files
COPY package*.json ./
COPY next.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
# Copy scripts directory (needed for Prisma generation)
COPY scripts ./scripts
# Copy public directory if it exists (Next.js uses it for static assets)
# If public directory doesn't exist, we'll create an empty one
RUN mkdir -p ./public
COPY public ./public

# Copy built postmind-db package from previous stage
COPY --from=db-builder /app/postmind-db ./postmind-db

# Link postmind-db as local dependency
RUN npm install ./postmind-db

# Build Next.js application
ENV DATABASE_URL="file:./prisma/dev.db"
RUN npm run db:generate
RUN npm run db:push
RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma (required for Alpine Linux)
RUN apk add --no-cache openssl openssl-dev

# Install Prisma CLI for migrations
RUN npm install -g prisma@^5.22.0

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=next-builder /app/public ./public
COPY --from=next-builder /app/.next/standalone ./
COPY --from=next-builder /app/.next/static ./.next/static
COPY --from=next-builder /app/postmind-db ./postmind-db
COPY --from=next-builder /app/node_modules/@postmind/db ./node_modules/@postmind/db
COPY --from=next-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=next-builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema for migrations
COPY --from=next-builder /app/postmind-db/prisma/schema.prisma ./postmind-db/prisma/schema.prisma

# Create entrypoint script to run migrations before starting
RUN echo '#!/bin/sh' > /app/docker-entrypoint.sh && \
    echo 'set -e' >> /app/docker-entrypoint.sh && \
    echo 'if [ -n "$DATABASE_URL" ]; then' >> /app/docker-entrypoint.sh && \
    echo '  echo "Running database migrations..."' >> /app/docker-entrypoint.sh && \
    echo '  cd /app/postmind-db && npx prisma db push --schema=./prisma/schema.prisma --skip-generate || true' >> /app/docker-entrypoint.sh && \
    echo '  cd /app' >> /app/docker-entrypoint.sh && \
    echo 'fi' >> /app/docker-entrypoint.sh && \
    echo 'exec "$@"' >> /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

# Create directory for database with proper permissions
RUN mkdir -p /app/data/prisma && \
    chown -R nextjs:nodejs /app

# Set working directory to app
WORKDIR /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Start the application
CMD ["node", "server.js"]

