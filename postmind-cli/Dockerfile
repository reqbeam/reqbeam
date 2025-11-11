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

# Create a symlink for global access
RUN ln -s /app/bin/postmind.js /usr/local/bin/postmind && \
    ln -s /app/bin/pm.js /usr/local/bin/pm

# Set working directory to home for CLI operations
WORKDIR /workspace

ENTRYPOINT ["postmind"]
CMD ["--help"]

