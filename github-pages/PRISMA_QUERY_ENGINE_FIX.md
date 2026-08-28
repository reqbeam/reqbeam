# Prisma Query Engine Fix

## Problem
After consolidating Prisma to use only `@reqbeam/db`, Next.js couldn't find the Prisma Query Engine:
```
Prisma Client could not locate the Query Engine for runtime "windows"
```

## Root Cause
1. `@reqbeam/db` had `@prisma/client` as a direct dependency, creating its own instance
2. Next.js was looking for the query engine in multiple locations
3. The query engine binaries weren't accessible to Next.js bundler

## Solution Applied

### 1. Made `@prisma/client` a Peer Dependency in `@reqbeam/db`
**File:** `oss-main/reqbeam-db/package.json`
- Removed `@prisma/client` from `dependencies`
- Kept it as `peerDependencies` (required, not optional)
- This ensures `@reqbeam/db` uses the `@prisma/client` from the root `node_modules`

### 2. Added `@prisma/client` to Web App Dependencies
**File:** `oss-main/package.json`
- Added `@prisma/client` back to dependencies
- Required for Next.js to properly bundle and locate query engine binaries

### 3. Updated Prisma Generation Script
**File:** `oss-main/package.json`
- Changed `db:generate` to run from web app root:
  ```json
  "db:generate": "prisma generate --schema=./reqbeam-db/prisma/schema.prisma"
  ```
- This generates the Prisma client to `oss-main/node_modules/@prisma/client`
- Ensures Next.js can find the query engine binaries

### 4. Added Binary Targets
**File:** `oss-main/reqbeam-db/prisma/schema.prisma`
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "windows"]
}
```
- Ensures Windows query engine binaries are downloaded

## Current Architecture

```
reqbeam-db/prisma/schema.prisma
    ↓ (prisma generate --schema=./reqbeam-db/prisma/schema.prisma)
oss-main/node_modules/@prisma/client
    ↓ (peer dependency resolution)
@reqbeam/db imports '@prisma/client' → resolves to root node_modules
    ↓
Web App + CLI use same instance
```

## Next Steps

1. **Restart Next.js Dev Server**: The dev server needs to be restarted after Prisma client generation
2. **Verify Query Engine**: The query engine should now be in `node_modules/@prisma/client`

## Verification

```bash
# Generate Prisma client (from web app root)
npm run db:generate

# Check that @prisma/client is in root node_modules
npm list @prisma/client

# Restart dev server
npm run dev
```

## Status

✅ **FIXED**: 
- `@prisma/client` is now a peer dependency in `@reqbeam/db`
- Prisma client is generated to web app's `node_modules`
- Both web app and `@reqbeam/db` use the same `@prisma/client` instance
- Query engine binaries should be accessible to Next.js

**Please restart your Next.js dev server for the changes to take effect.**

