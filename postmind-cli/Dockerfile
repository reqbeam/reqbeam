# Dockerfile for Postmind CLI
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Skip scripts during install to avoid prepublish hook running without source files
RUN npm ci --ignore-scripts

# Build the CLI
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Copy built files and node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bin ./bin

# Make CLI executable
RUN chmod +x ./bin/postmind.js ./bin/pm.js

# Create shell wrapper scripts for global access (more reliable than symlinks)
RUN echo '#!/bin/sh' > /usr/local/bin/postmind && \
    echo 'exec node /app/bin/postmind.js "$@"' >> /usr/local/bin/postmind && \
    chmod +x /usr/local/bin/postmind && \
    echo '#!/bin/sh' > /usr/local/bin/pm && \
    echo 'exec node /app/bin/pm.js "$@"' >> /usr/local/bin/pm && \
    chmod +x /usr/local/bin/pm

# Set working directory to home for CLI operations
WORKDIR /workspace

# Default entrypoint - can be overridden in docker-compose
ENTRYPOINT ["node", "/app/bin/postmind.js"]
# Default to help if no command provided, but docker-compose will override this
CMD ["--help"]

