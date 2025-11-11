# Docker Quick Start

## Prerequisites

- Docker and Docker Compose installed
- Auth server running on port 4000 (outside Docker)

## Quick Start (3 Steps)

### 1. Setup Environment

```bash
cp .env.docker.example .env.docker
# Edit .env.docker with your values
```

### 2. Start Services

```bash
# Build and start
docker-compose up -d

# Or use the Makefile
make build
make up
```

### 3. Initialize Database

```bash
docker-compose exec web npx prisma generate
docker-compose exec web npx prisma db push
```

## Access

- **Web UI**: http://localhost:3000
- **CLI**: `docker-compose run --rm cli <command>`

## Common Commands

```bash
# View logs
docker-compose logs -f

# Run CLI commands
docker-compose run --rm cli collection list
docker-compose run --rm cli auth login

# Stop services
docker-compose down

# Rebuild
docker-compose up --build -d
```

## Using Makefile

```bash
make help          # Show all commands
make up            # Start services
make cli CMD="collection list"  # Run CLI
make db-init       # Initialize database
make logs          # View logs
```

For detailed documentation, see [DOCKER.md](./DOCKER.md)

