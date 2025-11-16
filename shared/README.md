# Postmind Shared Library

This is the **centralized shared library** for Postmind that handles **ALL database connections and operations**.

## ⚠️ Critical Architecture Rule

**ALL database operations MUST go through the shared library. CLI and Web should NEVER import Prisma directly.**

## Overview

The shared library provides:
- **Centralized Database Connection**: Single Prisma client instance used by CLI, Web, and Auth Server
- **Database Services**: All CRUD operations through service classes
- **Type Safety**: Shared TypeScript types across the application

## Database Connection

**Important**: The database connection is initialized **ONLY** in `shared/prisma.ts`. All other parts of the application (CLI, Web, Auth Server) should import from here.

### Environment Variable

The shared library requires `DATABASE_URL` to be set in the environment:

```env
# For SQLite (development)
DATABASE_URL="file:./prisma/dev.db"

# For PostgreSQL (production)
DATABASE_URL="postgresql://user:password@localhost:5432/postmind?schema=public"
```

### Setup

1. **Set DATABASE_URL** in your root `.env` file (`oss-main/.env`)
2. **Generate Prisma Client** from the root directory:
   ```bash
   cd oss-main
   npm run db:generate
   ```
3. **Import and use** in your code - **NEVER import Prisma directly**:
   ```typescript
   // ✅ CORRECT - Use shared services
   import { CollectionService } from '../shared/index.js'
   const service = new CollectionService()
   
   // ❌ WRONG - Don't do this
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()
   ```

## Available Services

### UserService
- `findByEmail(email)` - Find user by email
- `findById(id)` - Find user by ID
- `findByIdForAuth(id)` - Find user for authentication (minimal fields)
- `create(data)` - Create new user
- `update(id, data)` - Update user

### CollectionService
- `getCollections(userId, workspaceId?)` - Get all collections
- `getCollection(id, userId)` - Get single collection
- `createCollection(data)` - Create collection
- `updateCollection(id, userId, data)` - Update collection
- `deleteCollection(id, userId)` - Delete collection

### RequestService
- `getRequests(userId, collectionId?, workspaceId?)` - Get all requests
- `getRequest(id, userId)` - Get single request
- `findRequestByName(name, userId, collectionId?)` - Find by name
- `createRequest(data)` - Create request
- `updateRequest(id, userId, data)` - Update request
- `deleteRequest(id, userId)` - Delete request

### EnvironmentService
- `getEnvironments(userId, workspaceId?)` - Get all environments
- `getEnvironment(id, userId)` - Get single environment
- `getActiveEnvironment(userId, workspaceId?)` - Get active environment
- `findEnvironmentByName(name, userId, workspaceId?)` - Find by name
- `createEnvironment(data)` - Create environment
- `updateEnvironment(id, userId, data)` - Update environment
- `deleteEnvironment(id, userId)` - Delete environment
- `activateEnvironment(id, userId)` - Activate environment

### WorkspaceService
- `getWorkspaces(userId)` - Get all workspaces (owned + member)
- `getWorkspace(id, userId)` - Get single workspace
- `createWorkspace(data)` - Create workspace
- `updateWorkspace(id, userId, data)` - Update workspace
- `deleteWorkspace(id, userId)` - Delete workspace

### HistoryService
- `getHistory(userId, workspaceId?)` - Get history entries
- `getRequestHistory(requestId, userId)` - Get request history
- `createHistory(data)` - Create history entry
- `clearHistory(userId, workspaceId?)` - Clear history

## Usage Examples

### CLI Usage

```typescript
import { CollectionService } from '../../../shared/index.js'

const collectionService = new CollectionService()
const collections = await collectionService.getCollections(userId, workspaceId)
```

### Web Usage

```typescript
import { UserService } from '../../../../shared/index.js'

const userService = new UserService()
const user = await userService.findByEmail(email)
```

### Auth Server Usage

```typescript
import { prisma } from '../prisma'  // Re-exports from shared
// or use services
import { UserService } from '../../shared/index.js'
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    CLI      │     │    Web      │     │ Auth Server │
│             │     │             │     │             │
│ NO Prisma   │     │ NO Prisma   │     │ NO Prisma   │
│ dependency  │     │ dependency  │     │ dependency  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           │ imports services
                           ▼
                    ┌─────────────┐
                    │   Shared    │
                    │   Library   │
                    │             │
                    │  prisma.ts  │ ◄─── DATABASE_URL (env var)
                    │             │
                    │  Services:  │
                    │  - User     │
                    │  - Collection│
                    │  - Request  │
                    │  - Env      │
                    │  - Workspace│
                    │  - History  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Database   │
                    └─────────────┘
```

## Package Dependencies

- **Root (`oss-main/package.json`)**: Has `@prisma/client` for Prisma CLI and shared library
- **Shared (`shared/package.json`)**: Has `@prisma/client` as dependency
- **CLI (`postmind-cli/package.json`)**: ❌ NO `@prisma/client` - uses shared library
- **Web (`package.json`)**: ❌ NO `@prisma/client` - uses shared library
- **Auth Server (`auth-server/package.json`)**: Has `@prisma/client` but re-exports from shared

## Rules

1. ✅ **DO**: Import services from shared library
2. ✅ **DO**: Use service methods for all database operations
3. ❌ **DON'T**: Import `PrismaClient` directly
4. ❌ **DON'T**: Create new Prisma client instances
5. ❌ **DON'T**: Add `@prisma/client` to CLI or Web dependencies
6. ❌ **DON'T**: Use `prisma` directly in CLI or Web code

## Adding New Services

If you need a new database operation:

1. Add method to appropriate service in `shared/services/`
2. Export from `shared/index.ts`
3. Use in CLI/Web through the service

Example:
```typescript
// shared/services/userService.ts
async findByUsername(username: string) {
  return await prisma.user.findFirst({
    where: { username }
  })
}
```

## Notes

- **Single Source of Truth**: Database connection is initialized once in `shared/prisma.ts`
- **No Duplication**: CLI and Web do NOT create their own Prisma clients
- **Environment Variable**: Must be set at the root level where the application runs
- **Prisma Schema**: Located at `oss-main/prisma/schema.prisma`
- **Prisma Client**: Generated from root directory with `npm run db:generate`
