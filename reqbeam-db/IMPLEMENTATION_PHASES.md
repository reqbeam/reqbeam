# Reqbeam Database Package - Implementation Phases

This document outlines the strategic phased approach for creating a shared database package (`@reqbeam/db`) that will be used by both the Web application and CLI, ensuring consistency and eliminating the CLI's dependency on REST APIs.

## Overview

The goal is to create a local npm package that:
- Provides unified database operations for both Web and CLI
- Maintains consistency between CLI and Web by sharing the same code
- Allows CLI to work directly with the database instead of relying on Web APIs
- Reduces code duplication and improves maintainability

## Architecture

```
┌─────────────┐         ┌──────────────┐
│   Web App   │────────►│ @reqbeam/db │
│  (Next.js)  │         │   (Package)  │
└─────────────┘         └──────────────┘
                               ▲
                               │
                       ┌───────┴───────┐
                       │               │
                  ┌─────────┐    ┌─────────┐
                  │  Prisma │    │Database │
                  │ Client  │───►│ (SQLite)│
                  └─────────┘    └─────────┘
                       ▲
                       │
                ┌─────────────┐
                │  CLI Tool    │
                │ (reqbeam-cli)│
                └─────────────┘
```

## Implementation Phases

### ✅ Phase 1: Package Structure Setup (COMPLETED)

**Goal**: Create the foundational structure for the `@reqbeam/db` package.

**Tasks Completed**:
- Created `reqbeam-db/` directory structure
- Set up `package.json` with proper dependencies
- Configured `tsconfig.json` for TypeScript compilation
- Created Prisma schema file (shared with main app)
- Set up Prisma client initialization (`src/client.ts`)
- Added `.gitignore` and `README.md`

**Files Created**:
- `reqbeam-db/package.json`
- `reqbeam-db/tsconfig.json`
- `reqbeam-db/prisma/schema.prisma`
- `reqbeam-db/src/client.ts`
- `reqbeam-db/.gitignore`
- `reqbeam-db/README.md`

### ✅ Phase 2: Types and Interfaces (COMPLETED)

**Goal**: Extract and define shared TypeScript types for all database models.

**Tasks Completed**:
- Created comprehensive type definitions for all entities
- Defined input types for create/update operations
- Added query options interfaces
- Ensured type safety across the package

**Files Created**:
- `reqbeam-db/src/types/index.ts`

**Types Defined**:
- `Collection`, `Request`, `Environment`, `Workspace`
- `ApiHistory`, `RequestHistory`, `MockServer`, `MockEndpoint`
- `Create*Input`, `Update*Input` types for all entities
- `QueryOptions`, `HistoryQueryOptions`

### ✅ Phase 3: Database Service Layer (COMPLETED)

**Goal**: Implement service classes that encapsulate all database operations.

**Tasks Completed**:
- Created `CollectionService` with full CRUD operations
- Created `RequestService` with full CRUD operations
- Created `EnvironmentService` with CRUD + activation logic
- Created `WorkspaceService` with CRUD + member management
- Created `HistoryService` for API and request history
- All services include proper error handling and validation

**Files Created**:
- `reqbeam-db/src/services/collections.ts`
- `reqbeam-db/src/services/requests.ts`
- `reqbeam-db/src/services/environments.ts`
- `reqbeam-db/src/services/workspaces.ts`
- `reqbeam-db/src/services/history.ts`
- `reqbeam-db/src/services/index.ts`
- `reqbeam-db/src/index.ts` (main export file)

**Service Methods**:
- **CollectionService**: `getCollections`, `getCollection`, `createCollection`, `updateCollection`, `deleteCollection`
- **RequestService**: `getRequests`, `getRequest`, `createRequest`, `updateRequest`, `deleteRequest`
- **EnvironmentService**: `getEnvironments`, `getEnvironment`, `createEnvironment`, `updateEnvironment`, `deleteEnvironment`, `activateEnvironment`
- **WorkspaceService**: `getWorkspaces`, `getWorkspace`, `createWorkspace`, `updateWorkspace`, `deleteWorkspace`, `addMember`, `removeMember`
- **HistoryService**: `getApiHistory`, `createApiHistory`, `clearApiHistory`, `getRequestHistory`, `createRequestHistory`, `clearRequestHistory`

### ✅ Phase 4: Migrate Web API Routes (COMPLETED)

**Goal**: Update Web API routes to use the shared package instead of direct Prisma calls.

**Tasks Completed**:
- Updated `package.json` to include `@reqbeam/db` as a local dependency
- Migrated collections API routes (`/api/collections`, `/api/collections/[id]`)
- Migrated requests API routes (`/api/requests`, `/api/requests/[id]`)
- Migrated environments API routes (`/api/environments`, `/api/environments/[id]`, `/api/environments/[id]/activate`)
- Migrated workspaces API routes (`/api/workspaces`, `/api/workspaces/[id]`)
- Migrated history API routes (`/api/history`)
- All routes now use service classes instead of direct Prisma calls

**Files Updated**:
- `oss-main/package.json` (added `@reqbeam/db` dependency)
- `oss-main/src/app/api/collections/route.ts`
- `oss-main/src/app/api/collections/[id]/route.ts`
- `oss-main/src/app/api/requests/route.ts`
- `oss-main/src/app/api/requests/[id]/route.ts`
- `oss-main/src/app/api/environments/route.ts`
- `oss-main/src/app/api/environments/[id]/route.ts`
- `oss-main/src/app/api/environments/[id]/activate/route.ts`
- `oss-main/src/app/api/workspaces/route.ts`
- `oss-main/src/app/api/workspaces/[id]/route.ts`
- `oss-main/src/app/api/history/route.ts`

### ⏳ Phase 5: Update CLI (PENDING)

**Goal**: Replace CLI's API client with direct database package usage.

**Tasks to Complete**:
1. Update CLI `package.json` to include `@reqbeam/db` as a local dependency
2. Create database connection utility for CLI (handles DATABASE_URL from config)
3. Replace `ApiClient` usage in CLI commands with service classes:
   - Update `collection.ts` command
   - Update `request.ts` command
   - Update `env.ts` command
   - Update `workspace.ts` command
   - Update `run.ts` command (for history logging)
   - Update `logs.ts` command
4. Update authentication flow to work with direct database access
5. Remove or deprecate `apiClient.ts` and `apiStorage.ts`

**Files to Update**:
- `reqbeam-cli/package.json`
- `reqbeam-cli/src/utils/context.ts` (add database connection)
- `reqbeam-cli/src/commands/collection.ts`
- `reqbeam-cli/src/commands/request.ts`
- `reqbeam-cli/src/commands/env.ts`
- `reqbeam-cli/src/commands/workspace.ts`
- `reqbeam-cli/src/commands/run.ts`
- `reqbeam-cli/src/commands/logs.ts`

### ⏳ Phase 6: Testing and Validation (PENDING)

**Goal**: Ensure consistency between CLI and Web, test all operations.

**Tasks to Complete**:
1. Test all CRUD operations from Web UI
2. Test all CRUD operations from CLI
3. Verify data consistency between CLI and Web
4. Test workspace isolation
5. Test authentication and authorization
6. Test error handling and edge cases
7. Update documentation

## Next Steps

1. **Build the package**: Run `npm run build` in `reqbeam-db/` directory
2. **Install in Web**: Run `npm install` in `oss-main/` directory
3. **Install in CLI**: Run `npm install` in `reqbeam-cli/` directory (after Phase 5)
4. **Generate Prisma Client**: Run `npm run db:generate` in `reqbeam-db/` directory
5. **Test Web routes**: Verify all API endpoints work correctly
6. **Implement Phase 5**: Update CLI to use the package
7. **Implement Phase 6**: Comprehensive testing

## Benefits

1. **Code Reusability**: Single source of truth for database operations
2. **Consistency**: CLI and Web use identical logic
3. **Maintainability**: Changes in one place affect both applications
4. **Performance**: CLI no longer needs HTTP overhead
5. **Offline Capability**: CLI can work with local database
6. **Type Safety**: Shared types ensure consistency
7. **Testing**: Easier to test database operations in isolation

## Notes

- The package uses Prisma as the ORM
- Database URL can be configured per environment (CLI vs Web)
- All services include proper error handling
- Services validate ownership before operations
- Workspace isolation is maintained throughout

