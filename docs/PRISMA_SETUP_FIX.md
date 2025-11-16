# Prisma Setup Fix

## Problem
After removing the web app's Prisma schema, Next.js couldn't find the Prisma Query Engine, causing:
```
Prisma Client could not locate the Query Engine for runtime "windows"
```

## Solution

### 1. Added `@prisma/client` Back to Web App Dependencies
Even though `@postmind/db` has `@prisma/client` as a dependency, Next.js needs it in the root `node_modules` for proper bundling and to locate the query engine binaries.

**File:** `oss-main/package.json`
```json
"dependencies": {
  "@postmind/db": "file:./postmind-db",
  "@prisma/client": "^5.22.0",  // ← Added back
  ...
}
```

### 2. Prisma Client Generation
The Prisma client is generated from the shared schema in `postmind-db`:
- **Schema:** `oss-main/postmind-db/prisma/schema.prisma`
- **Output:** `oss-main/node_modules/@prisma/client` (default location)
- **Command:** `npm run db:generate` (runs in postmind-db)

### 3. How It Works

```
postmind-db/prisma/schema.prisma
    ↓ (prisma generate)
oss-main/node_modules/@prisma/client
    ↓ (imported by)
@postmind/db → exports prisma
    ↓ (used by)
Web App + CLI
```

### 4. Important Points

1. **Single Schema**: Only `postmind-db/prisma/schema.prisma` exists
2. **Single Generated Client**: Generated to web app's `node_modules/@prisma/client`
3. **Shared Instance**: Both web and CLI use the same `prisma` instance from `@postmind/db`
4. **Next.js Compatibility**: `@prisma/client` in root dependencies ensures Next.js can find query engine

### 5. Commands

```bash
# Generate Prisma client (from shared schema)
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

All commands run in `postmind-db` but generate to the web app's `node_modules`.

## Status

✅ **FIXED**: Prisma client is now properly generated and accessible to Next.js

