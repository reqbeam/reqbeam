#!/bin/sh
# Don't use set -e, we want to handle errors gracefully

# Ensure we're in the app directory
cd /app

# Set npm cache directory to a writable location to avoid permission issues
export NPM_CONFIG_CACHE=/tmp/.npm
export HOME=/app

# Create npm cache directory with proper permissions
mkdir -p /tmp/.npm
chmod 777 /tmp/.npm 2>/dev/null || true

echo "=== Docker Entrypoint Starting ==="
echo "Working directory: $(pwd)"
echo "DATABASE_URL: ${DATABASE_URL:-not set}"

# Create prisma directory if it doesn't exist
mkdir -p /app/prisma || echo "Warning: Could not create /app/prisma directory"

# Fix permissions for prisma directory (in case it's mounted as volume)
# On Windows volume mounts, chown may fail, so we ignore errors
if [ -d "/app/prisma" ]; then
    echo "Setting permissions on /app/prisma..."
    chown -R nextjs:nodejs /app/prisma 2>/dev/null || echo "Warning: Could not change ownership (may be normal on Windows mounts)"
    chmod -R 775 /app/prisma 2>/dev/null || echo "Warning: Could not change permissions (may be normal on Windows mounts)"
fi

# Check if Prisma client exists
if [ ! -d "/app/node_modules/.prisma/client" ]; then
    echo "Prisma client not found, generating..."
    su -s /bin/sh nextjs -c "cd /app && export NPM_CONFIG_CACHE=/tmp/.npm && export HOME=/app && npx prisma generate" || {
        echo "ERROR: Failed to generate Prisma client"
        exit 1
    }
fi

# Initialize or update database schema
if [ ! -f "/app/prisma/dev.db" ]; then
    echo "=== Initializing database ==="
    echo "Database file not found, creating..."
    
    # Run db push as nextjs user to ensure proper permissions
    echo "Running: npx prisma db push --skip-generate"
    su -s /bin/sh nextjs -c "cd /app && export NPM_CONFIG_CACHE=/tmp/.npm && export HOME=/app && npx prisma db push --skip-generate --accept-data-loss" || {
        echo "ERROR: Database initialization failed!"
        echo "Attempting to create database file manually..."
        # Try to create an empty database file as a last resort
        touch /app/prisma/dev.db 2>/dev/null || echo "Could not create database file"
        chown nextjs:nodejs /app/prisma/dev.db 2>/dev/null || true
        chmod 664 /app/prisma/dev.db 2>/dev/null || true
        # Try db push again
        su -s /bin/sh nextjs -c "cd /app && export NPM_CONFIG_CACHE=/tmp/.npm && export HOME=/app && npx prisma db push --skip-generate --accept-data-loss" || {
            echo "ERROR: Database initialization failed after retry"
            exit 1
        }
    }
    
    # Fix permissions after initialization
    if [ -f "/app/prisma/dev.db" ]; then
        chown nextjs:nodejs /app/prisma/dev.db 2>/dev/null || true
        chmod 664 /app/prisma/dev.db 2>/dev/null || true
        echo "Database initialized successfully at /app/prisma/dev.db"
        ls -lh /app/prisma/dev.db || true
    else
        echo "ERROR: Database file was not created!"
        exit 1
    fi
else
    echo "Database file already exists at /app/prisma/dev.db"
    ls -lh /app/prisma/dev.db || true
    
    # Always ensure schema is up to date (db push is idempotent)
    # This handles cases where the database exists but tables are missing
    echo "=== Ensuring database schema is up to date ==="
    echo "Running: npx prisma db push --skip-generate --accept-data-loss"
    
    # Run db push and capture output
    # Set npm cache and home directory for the nextjs user to avoid permission issues
    if su -s /bin/sh nextjs -c "cd /app && export NPM_CONFIG_CACHE=/tmp/.npm && export HOME=/app && npx prisma db push --skip-generate --accept-data-loss 2>&1"; then
        echo "✓ Database schema updated successfully"
    else
        echo "ERROR: Database schema update failed!"
        echo "Attempting to verify database state..."
        
        # Try to check if we can at least connect to the database
        # Use echo with pipe instead of <<< which is not supported in /bin/sh
        echo "SELECT name FROM sqlite_master WHERE type='table';" | su -s /bin/sh nextjs -c "cd /app && export NPM_CONFIG_CACHE=/tmp/.npm && export HOME=/app && npx prisma db execute --stdin" 2>&1 || echo "Could not query database"
        
        echo "ERROR: Failed to apply database schema. The application may not work correctly."
        echo "You may need to manually run: docker-compose exec web npx prisma db push"
        # Don't exit here - let the app start and show the error, but log it clearly
    fi
fi

# Ensure database file has correct permissions
if [ -f "/app/prisma/dev.db" ]; then
    echo "Verifying database file permissions..."
    chown nextjs:nodejs /app/prisma/dev.db 2>/dev/null || true
    chmod 664 /app/prisma/dev.db 2>/dev/null || true
    chmod 775 /app/prisma 2>/dev/null || true
    
    # Verify the file is readable
    if [ ! -r "/app/prisma/dev.db" ]; then
        echo "WARNING: Database file is not readable!"
    fi
    
    # Verify the file is writable
    if [ ! -w "/app/prisma/dev.db" ]; then
        echo "WARNING: Database file is not writable!"
    fi
else
    echo "ERROR: Database file not found at /app/prisma/dev.db"
    exit 1
fi

echo "=== Starting application ==="
# Switch to nextjs user and start the application
# Set npm cache and home directory to avoid permission issues
exec su -s /bin/sh nextjs -c "cd /app && export NPM_CONFIG_CACHE=/tmp/.npm && export HOME=/app && exec $*"

