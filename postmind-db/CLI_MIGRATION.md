# CLI Migration to Direct Database Access

This document describes the migration of the CLI from REST API calls to direct database access using the `@postmind/db` package.

## Overview

The CLI has been updated to use the shared database package instead of making HTTP requests to the web API. This provides:
- **Consistency**: CLI and Web use the same database operations
- **Performance**: No HTTP overhead
- **Offline capability**: Can work with local database
- **Type safety**: Shared types ensure consistency

## Changes Made

### 1. Package Dependencies

**File**: `postmind-cli/package.json`
- Added `@postmind/db` as a local dependency

### 2. Database Connection Manager

**File**: `postmind-cli/src/utils/db.ts` (NEW)
- Created `DatabaseManager` class to handle database connections
- Manages Prisma client instance
- Gets database URL from `DATABASE_URL` environment variable
- Provides helper methods to get current user ID

### 3. Storage Manager Update

**File**: `postmind-cli/src/utils/apiStorage.ts`
- Completely rewritten to use database services instead of API client
- Uses `CollectionService`, `RequestService`, `EnvironmentService`, `WorkspaceService`, `HistoryService`
- Maintains the same public API for backward compatibility
- All methods now use direct database access

### 4. Commands

All CLI commands continue to work without changes because they use the `ApiStorageManager` interface, which has been updated internally to use the database package.

**Commands that work unchanged**:
- `collection` - Create, list, update, delete collections
- `request` - Create, list, update, delete requests
- `env` - Manage environments
- `workspace` - Manage workspaces
- `run` - Execute requests and collections
- `logs` - View execution logs

## Setup Instructions

### 1. Build the Database Package

```bash
cd oss-main/postmind-db
npm install
npm run build
npm run db:generate
```

### 2. Install in CLI

```bash
cd oss-main/postmind-cli
npm install
npm run build
```

### 3. Set Environment Variable

The CLI needs to connect to the same database as the web application:

**For SQLite**:
```bash
export DATABASE_URL="file:./prisma/dev.db"
```

**For PostgreSQL**:
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

**Note**: The database URL should be the same as the one used by the web application.

### 4. Authentication

The CLI still uses the authentication system to get the current user ID. You still need to log in:

```bash
postmind auth login
```

The authentication token is used to identify the current user for database operations.

## Architecture

```
┌─────────────┐
│  CLI Commands│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ ApiStorageManager│
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ Database Services │
│ (@postmind/db)   │
└──────┬───────────┘
       │
       ▼
┌─────────────┐
│  Prisma     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │
└─────────────┘
```

## Benefits

1. **No API Dependency**: CLI no longer needs the web server to be running
2. **Faster Operations**: Direct database access is faster than HTTP requests
3. **Consistency**: Same code used by both CLI and Web ensures identical behavior
4. **Type Safety**: Shared TypeScript types prevent type mismatches
5. **Easier Testing**: Database operations can be tested independently

## Migration Notes

- The `ApiClient` class is no longer used but kept for reference
- All database operations now go through the service layer
- Workspace context is still maintained for filtering operations
- History logging now uses the database directly instead of API calls

## Troubleshooting

### Error: DATABASE_URL not found

Make sure you've set the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="file:./prisma/dev.db"
```

### Error: Not authenticated

You still need to log in to identify the current user:
```bash
postmind auth login
```

### Error: Failed to connect to database

Check that:
1. The database file exists (for SQLite) or the database server is running (for PostgreSQL)
2. The `DATABASE_URL` is correct
3. You have proper permissions to access the database

## Future Improvements

- Add database connection pooling
- Support for multiple database connections
- Better error messages for database connection issues
- Database migration tools for CLI

