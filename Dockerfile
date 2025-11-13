# Dockerfile for Next.js Web Application
# Using Debian-based image for better Prisma compatibility
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y \
    libc6 \
    openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
# Install OpenSSL for Prisma generation
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client for the correct platform (Debian/glibc)
# This ensures we get the correct binary for Debian, not Alpine/musl
# Force regeneration by removing any existing Prisma client
RUN rm -rf node_modules/.prisma node_modules/@prisma/client || true
# Set environment variable to ensure correct binary target
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x
ENV DATABASE_URL=file:/app/prisma/dev.db
RUN npm run db:generate
RUN npm run db:push
RUN npx prisma generate

# Verify the correct binary was generated (should see debian-openssl, not musl)
RUN ls -la node_modules/.prisma/client/ | grep -E "(debian|query_engine)" || echo "Warning: Binary verification failed"

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install required libraries for Prisma and health check
# Install Prisma CLI and OpenSSL libraries
# Note: libssl3 is for Debian 12 (Bookworm), which node:20-slim uses
RUN apt-get update && apt-get install -y \
    wget \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# Copy necessary files from builder
# Next.js standalone build includes public folder automatically, so we don't need to copy it separately
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy Prisma schema and package.json for regeneration
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
# Copy Prisma packages (already generated in builder stage with correct platform)
# Only copy the Debian binary, exclude any musl binaries
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Remove any musl binaries if they exist and verify Debian binary is present
RUN find node_modules/.prisma -name "*musl*" -delete || true
RUN ls -la node_modules/.prisma/client/ | grep -E "(debian|query_engine)" || echo "Warning: Debian binary not found"

# Copy entrypoint script and fix line endings (Windows CRLF to Unix LF)
COPY docker-entrypoint.sh /tmp/docker-entrypoint.sh
RUN sed -i 's/\r$//' /tmp/docker-entrypoint.sh && \
    mv /tmp/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    ls -la /usr/local/bin/docker-entrypoint.sh && \
    head -n 1 /usr/local/bin/docker-entrypoint.sh | od -c

# Set correct permissions
RUN chown -R nextjs:nodejs /app

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]

