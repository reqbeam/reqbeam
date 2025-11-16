# Database Setup Guide

## Overview

The database connection is **centralized in the shared library** (`oss-main/shared/prisma.ts`). All components (CLI, Web, Auth Server) use this single connection.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    CLI     │     │    Web      │     │ Auth Server │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           │ imports
                           ▼
                    ┌─────────────┐
                    │   Shared    │
                    │   Library   │
                    │             │
                    │  prisma.ts  │ ◄─── DATABASE_URL (env var)
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Database   │
                    │ (SQLite/    │
                    │ PostgreSQL) │
                    └─────────────┘
```

## Setup Instructions

### 1. Create Environment File

Create a `.env` file in the **root directory** (`oss-main/.env`):

```env
# Database Connection
# For SQLite (development)
DATABASE_URL="file:./prisma/dev.db"

# For PostgreSQL (production)
DATABASE_URL="postgresql://username:password@localhost:5432/postmind?schema=public"
```

### 2. Generate Prisma Client

From the root directory (`oss-main/`):

```bash
npm run db:generate
```

This generates the Prisma Client that the shared library uses.

### 3. Push Schema to Database

```bash
npm run db:push
```

This creates all tables in your database.

### 4. Verify Setup

```bash
# Open Prisma Studio to view your database
npm run db:studio
```

## Database Providers

### SQLite (Development)

```env
DATABASE_URL="file:./prisma/dev.db"
```

- **Pros**: No setup required, good for development
- **Cons**: Not suitable for production, limited features

### PostgreSQL (Production)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/postmind?schema=public"
```

- **Pros**: Production-ready, full-featured
- **Cons**: Requires PostgreSQL installation

### Supabase (Cloud PostgreSQL)

```env
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?schema=public"
```

- **Pros**: Managed service, free tier available
- **Cons**: Requires Supabase account

## Usage in Code

### CLI

The CLI automatically uses the shared library:

```typescript
import { CollectionService } from '../../../shared/index.js'

const service = new CollectionService()
// Database connection is handled automatically
```

### Web

The Web also uses the shared library:

```typescript
import { prisma } from '@/lib/prisma'  // Re-exports from shared
// or
import { CollectionService } from '../../../../shared/index.js'
```

### Auth Server

The Auth Server uses the shared library:

```typescript
import { prisma } from '../prisma'  // Re-exports from shared
```

## Important Notes

1. **Single Connection**: Database connection is initialized **only once** in `shared/prisma.ts`
2. **Environment Variable**: `DATABASE_URL` must be set at the root level
3. **No Duplication**: Do NOT create Prisma clients in CLI, Web, or Auth Server
4. **Prisma Schema**: Located at `oss-main/prisma/schema.prisma`
5. **Prisma Client**: Generated from root directory with `npm run db:generate`

## Troubleshooting

### "DATABASE_URL is not set" Error

**Solution**: Ensure `.env` file exists in `oss-main/` with `DATABASE_URL` set.

### "Cannot find module '@prisma/client'" Error

**Solution**: Run `npm run db:generate` from the root directory.

### Connection Refused (PostgreSQL)

**Solution**: 
1. Ensure PostgreSQL is running
2. Verify connection string is correct
3. Check database exists and user has permissions

### SQLite Database Not Found

**Solution**: 
1. Ensure `prisma/` directory exists
2. Run `npm run db:push` to create the database file
3. Check file permissions

## Migration

If you need to change database providers:

1. Update `DATABASE_URL` in `.env`
2. Update `provider` in `prisma/schema.prisma` if needed
3. Run `npm run db:push` to apply changes
4. Restart all services (CLI, Web, Auth Server)

## Best Practices

1. **Development**: Use SQLite for local development
2. **Production**: Use PostgreSQL or Supabase
3. **Environment Variables**: Never commit `.env` files
4. **Backup**: Regularly backup your database
5. **Migrations**: Use Prisma migrations for schema changes

