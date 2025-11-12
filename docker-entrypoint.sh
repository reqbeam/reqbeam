#!/bin/sh
set -e

# Fix permissions for prisma directory (in case it's mounted as volume)
if [ -d "/app/prisma" ]; then
    chown -R nextjs:nodejs /app/prisma 2>/dev/null || true
    chmod -R 775 /app/prisma 2>/dev/null || true
fi

# Initialize database if it doesn't exist
if [ ! -f "/app/prisma/dev.db" ]; then
    echo "Initializing database..."
    # Run as current user (root) to ensure we can create the database
    cd /app
    npx prisma db push --skip-generate || true
    # Fix permissions after initialization
    chown -R nextjs:nodejs /app/prisma 2>/dev/null || true
    chmod 664 /app/prisma/dev.db 2>/dev/null || true
    echo "Database initialized successfully"
fi

# Ensure database file has correct permissions
if [ -f "/app/prisma/dev.db" ]; then
    chown nextjs:nodejs /app/prisma/dev.db 2>/dev/null || true
    chmod 664 /app/prisma/dev.db 2>/dev/null || true
fi

# Switch to nextjs user and start the application
# Use eval to properly handle command arguments
exec su -s /bin/sh nextjs -c "cd /app && exec $*"

