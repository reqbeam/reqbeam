# Database Architecture - Centralized in Shared Library

## Core Principle

**ALL database operations MUST go through the shared library. CLI and Web should NEVER import Prisma directly.**

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Root Package                         │
│  - Has @prisma/client (for Prisma CLI & shared lib)     │
│  - Has prisma (CLI tool)                               │
│  - Generates Prisma Client                              │
└─────────────────────────────────────────────────────────┘
                          │
                          │ provides
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Shared Library (shared/)                   │
│  - Has @prisma/client as peerDependency                │
│  - Initializes Prisma Client (ONLY place)              │
│  - Provides all database services                       │
│  - Exports: prisma, UserService, CollectionService, etc.│
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         │ imports            │ imports            │ imports
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    CLI      │      │    Web      │      │ Auth Server │
│             │      │             │      │             │
│ ❌ NO       │      │ ❌ NO       │      │ ❌ NO       │
│ @prisma/    │      │ @prisma/    │      │ @prisma/    │
│ client      │      │ client      │      │ client      │
│             │      │             │      │             │
│ ✅ Uses     │      │ ✅ Uses     │      │ ✅ Uses     │
│ shared      │      │ shared      │      │ shared      │
│ services    │      │ services    │      │ services    │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Package Dependencies

### Root (`oss-main/package.json`)
```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0"  // ✅ Required for Prisma CLI and shared library
  },
  "devDependencies": {
    "prisma": "^5.22.0"  // ✅ Required for Prisma CLI commands
  }
}
```

### Shared Library (`shared/package.json`)
```json
{
  "peerDependencies": {
    "@prisma/client": "^5.22.0"  // ✅ Indicates it needs Prisma, but gets it from root
  }
}
```

### CLI (`postmind-cli/package.json`)
```json
{
  "dependencies": {
    // ❌ NO @prisma/client - uses shared library instead
  }
}
```

### Web (`package.json`)
```json
{
  "dependencies": {
    // ❌ NO @prisma/client - uses shared library instead
  }
}
```

## Why This Architecture?

1. **Single Source of Truth**: Database connection initialized once
2. **No Duplication**: One Prisma client instance for entire application
3. **Consistency**: All components use same database logic
4. **Maintainability**: Changes in one place affect all components
5. **Type Safety**: Shared types across CLI and Web

## Rules

### ✅ DO

- Import services from shared library
- Use service methods for all database operations
- Set DATABASE_URL in root `.env` file
- Generate Prisma client from root: `npm run db:generate`

### ❌ DON'T

- Import `PrismaClient` directly in CLI or Web
- Create new Prisma client instances
- Add `@prisma/client` to CLI or Web package.json
- Use `prisma` directly in CLI or Web code
- Access database without going through shared services

## Migration Status

✅ **Completed:**
- Shared library with all services
- CLI uses shared services
- Auth routes use UserService
- Core CRUD operations use services

⚠️ **Remaining:**
- Some Web API routes still use `prisma` directly
- See `MIGRATION_NOTES.md` for details

## Example: Correct Usage

```typescript
// ✅ CORRECT - CLI
import { CollectionService } from '../../../shared/index.js'
const service = new CollectionService()
const collections = await service.getCollections(userId)

// ✅ CORRECT - Web
import { UserService } from '../../../../shared/index.js'
const userService = new UserService()
const user = await userService.findByEmail(email)

// ❌ WRONG - Don't do this
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

## Setup

1. **Root `.env` file** (`oss-main/.env`):
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   ```

2. **Generate Prisma Client** (from root):
   ```bash
   cd oss-main
   npm run db:generate
   ```

3. **Use in code**:
   ```typescript
   import { CollectionService } from '../shared/index.js'
   ```

That's it! No separate database configuration needed for CLI or Web.

