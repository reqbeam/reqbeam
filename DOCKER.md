# Docker Setup Guide

This guide explains how to run Postmind using Docker. The setup includes:
- **Web Application** (Next.js) - Port 3000
- **CLI Tool** - Available as a Docker container
- **Auth Server** - Runs outside Docker (not dockerized)

## Prerequisites

- Docker and Docker Compose installed
- Auth server running on port 4000 (outside Docker)
- At least 2GB of free disk space

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd oss-main
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.docker.example .env.docker
   # Edit .env.docker with your configuration
   ```

3. **Build and start services:**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database:**
   ```bash
   docker-compose exec web npx prisma db push
   docker-compose exec web npx prisma generate
   ```

5. **Access the application:**
   - Web UI: http://localhost:3000
   - CLI: Use `docker-compose run cli <command>`

## Using the CLI

### Run CLI Commands

```bash
# List collections
docker-compose run --rm cli collection list

# Authenticate
docker-compose run --rm cli auth login

# List workspaces
docker-compose run --rm cli workspace list

# Run any CLI command
docker-compose run --rm cli <command> [options]
```

### Interactive CLI Session

```bash
# Start interactive CLI container
docker-compose run --rm -it cli sh

# Then run CLI commands inside
postmind collection list
postmind auth login
```

### Persistent CLI Configuration

CLI authentication tokens are stored in a Docker volume (`cli-config`), so you only need to login once:

```bash
# Login (first time)
docker-compose run --rm cli auth login

# Subsequent commands will use saved credentials
docker-compose run --rm cli collection list
```

## Environment Variables

### Required Variables

- `AUTH_SERVER_URL`: URL of the auth server (default: `http://host.docker.internal:4000`)
- `NEXTAUTH_SECRET`: Secret key for NextAuth (generate a secure random string)
- `DATABASE_URL`: Database connection string

### Optional Variables

- `GOOGLE_CLIENT_ID`: For Google OAuth login
- `GOOGLE_CLIENT_SECRET`: For Google OAuth login
- `NEXT_PUBLIC_APP_NAME`: Application name

## Docker Services

### Web Service

- **Port**: 3000
- **Health Check**: Available at `/api/health`
- **Volumes**:
  - `./prisma`: Database files
  - `postmind-data`: Application data

### CLI Service

- **Entrypoint**: `postmind`
- **Volumes**:
  - `./workspace`: Working directory for CLI operations
  - `cli-config`: CLI configuration and auth tokens

## Common Commands

### Start Services

```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Rebuild and start
docker-compose up --build
```

### Stop Services

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f cli
```

### Database Operations

```bash
# Push schema changes
docker-compose exec web npx prisma db push

# Generate Prisma Client
docker-compose exec web npx prisma generate

# Open Prisma Studio
docker-compose exec web npx prisma studio
# Then access at http://localhost:5555
```

### Shell Access

```bash
# Web container
docker-compose exec web sh

# CLI container
docker-compose exec cli sh
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```yaml
# In docker-compose.yml, change:
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Auth Server Connection Issues

On Linux, `host.docker.internal` might not work. Use your host IP instead:

```bash
# Find your host IP
ip addr show docker0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1

# Or use the host network mode (Linux only)
# In docker-compose.yml:
network_mode: "host"
```

### Database Issues

If you need to reset the database:

```bash
# Remove database volume
docker-compose down -v

# Recreate and initialize
docker-compose up -d
docker-compose exec web npx prisma db push
```

### CLI Authentication Issues

If CLI authentication fails:

1. Check auth server is running: `curl http://localhost:4000/api/auth/verify`
2. Verify `AUTH_SERVER_URL` in `.env.docker`
3. Try logging in again: `docker-compose run --rm cli auth login`

## Production Deployment

For production:

1. **Use environment-specific values:**
   ```bash
   cp .env.docker.example .env.docker
   # Update with production values
   ```

2. **Use PostgreSQL instead of SQLite:**
   ```env
   DATABASE_URL="postgresql://user:pass@postgres:5432/postmind"
   ```

3. **Set secure secrets:**
   ```env
   NEXTAUTH_SECRET="$(openssl rand -base64 32)"
   ```

4. **Use Docker secrets or environment files:**
   ```bash
   docker-compose --env-file .env.docker up -d
   ```

## Notes

- **Auth Server**: The auth server runs outside Docker and must be accessible from containers
- **Database**: SQLite database is persisted in `./prisma` directory
- **CLI Config**: CLI authentication is stored in Docker volume `cli-config`
- **Networking**: Services communicate via `postmind-network` bridge network

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Ensure auth server is running
4. Check Docker and Docker Compose versions

