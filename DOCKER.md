# Docker Setup for Postmind

This guide explains how to run the Postmind web application and database in a Docker container with volume mounting for database persistence.

## Prerequisites

- Docker Engine 20.10 or later
- Docker Compose 2.0 or later

## Quick Start

1. **Copy the example environment file** (if you haven't already):
   ```bash
   cp env.example .env
   ```

2. **Update the `.env` file** with your configuration:
   ```env
   DATABASE_URL=file:/app/data/prisma/dev.db
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   NEXT_PUBLIC_APP_NAME=OSS
   ```

3. **Build and start the container**:
   ```bash
   docker-compose up -d --build
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f
   ```

5. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Volume Mounting

The database file is stored in a Docker volume named `postmind-db-data`, which ensures:
- **Persistence**: Database data persists across container restarts
- **Backup**: Easy to backup by exporting the volume
- **Portability**: Can be moved between hosts

### Volume Location

The database is stored at `/app/data/prisma/dev.db` inside the container and mounted to the Docker volume.

### Accessing the Database Volume

To access the database file directly:

```bash
# List volumes
docker volume ls

# Inspect the volume
docker volume inspect postmind-db-data

# Access the database file (requires root)
docker run --rm -v postmind-db-data:/data alpine ls -la /data
```

### Backup Database

```bash
# Create a backup
docker run --rm -v postmind-db-data:/data -v $(pwd):/backup alpine tar czf /backup/postmind-db-backup.tar.gz /data

# Restore from backup
docker run --rm -v postmind-db-data:/data -v $(pwd):/backup alpine tar xzf /backup/postmind-db-backup.tar.gz -C /
```

### Using a Local Directory Instead of Volume

If you prefer to mount a local directory instead of a Docker volume, modify `docker-compose.yml`:

```yaml
volumes:
  - ./data/prisma:/app/data/prisma
```

This will store the database in `./data/prisma/dev.db` on your host machine.

## Environment Variables

Key environment variables (set in `.env` or `docker-compose.yml`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:/app/data/prisma/dev.db` |
| `NEXTAUTH_URL` | Base URL for NextAuth | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret key for NextAuth | Required |
| `NEXT_PUBLIC_APP_NAME` | Application name | `OSS` |
| `AUTH_SERVER_URL` | Auth server URL (if separate) | `http://localhost:4000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) | - |

## Commands

### Build the image
```bash
docker-compose build
```

### Start containers
```bash
docker-compose up -d
```

### Stop containers
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f postmind-app
```

### Execute commands in container
```bash
# Access shell
docker-compose exec postmind-app sh

# Run Prisma Studio
docker-compose exec postmind-app npx prisma studio --schema=./postmind-db/prisma/schema.prisma
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

## Database Migrations

Database migrations are automatically run when the container starts via the entrypoint script. The script runs `prisma db push` to ensure the database schema is up to date.

To manually run migrations:

```bash
docker-compose exec postmind-app sh -c "cd /app/postmind-db && npx prisma db push --schema=./prisma/schema.prisma"
```

## Troubleshooting

### Container won't start

1. Check logs:
   ```bash
   docker-compose logs postmind-app
   ```

2. Verify environment variables:
   ```bash
   docker-compose config
   ```

3. Check database permissions:
   ```bash
   docker-compose exec postmind-app ls -la /app/data/prisma
   ```

### Database not persisting

1. Verify volume is mounted:
   ```bash
   docker volume inspect postmind-db-data
   ```

2. Check if database file exists:
   ```bash
   docker-compose exec postmind-app ls -la /app/data/prisma
   ```

### Port already in use

If port 3000 is already in use, change it in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Use port 3001 on host
```

## Production Considerations

For production deployments:

1. **Use a strong NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

2. **Use PostgreSQL instead of SQLite**:
   - Update `DATABASE_URL` to PostgreSQL connection string
   - Update Prisma schema `provider` to `postgresql`
   - Consider using a separate database service

3. **Enable HTTPS**:
   - Use a reverse proxy (nginx, Traefik)
   - Update `NEXTAUTH_URL` to HTTPS URL

4. **Resource limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 1G
   ```

5. **Health checks**: Already configured in `docker-compose.yml`

## Architecture

```
┌─────────────────────────────────────┐
│         Docker Container            │
│  ┌───────────────────────────────┐  │
│  │      Next.js Web App          │  │
│  │      (Port 3000)              │  │
│  └───────────┬─────────────────┘  │
│              │                      │
│  ┌───────────▼─────────────────┐  │
│  │    @postmind/db Package      │  │
│  │    (Prisma Client)           │  │
│  └───────────┬─────────────────┘  │
│              │                      │
│  ┌───────────▼─────────────────┐  │
│  │    SQLite Database          │  │
│  │    /app/data/prisma/dev.db  │  │
│  └─────────────────────────────┘  │
└──────────────┬─────────────────────┘
               │
               │ Volume Mount
               ▼
      ┌─────────────────┐
      │ Docker Volume   │
      │ postmind-db-data│
      └─────────────────┘
```

## Support

For issues or questions:
- Check the logs: `docker-compose logs -f`
- Review the [README.md](./README.md) for general setup
- Check [SETUP_INSTRUCTIONS.md](./postmind-db/SETUP_INSTRUCTIONS.md) for database setup

