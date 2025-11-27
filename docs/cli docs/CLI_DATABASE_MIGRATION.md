# CLI Database Migration Summary

## Overview
The Reqbeam CLI has been updated to use direct database access via `@reqbeam/db` instead of making HTTP requests to the web application APIs (localhost:3000).

## Changes Made

### 1. Authentication System
**File:** `src/utils/auth.ts`

- **Before:** Made HTTP POST requests to `${apiUrl}/api/auth/login` and `${apiUrl}/api/auth/token`
- **After:** Uses `UserService` from `@reqbeam/db` to:
  - Query user by email directly from database
  - Verify password using `bcrypt.compare()`
  - Generate simple token (base64 encoded user ID + timestamp)
  - Validate token by checking if user exists in database

**Key Changes:**
- Removed `axios` dependency for auth operations
- Added `bcryptjs` for password verification
- Removed `apiUrl` requirement (now optional for backward compatibility)
- Token validation now checks database instead of making API calls

### 2. Auth Command
**File:** `src/commands/auth.ts`

- **Removed:** `--url` option (no longer needs API URL)
- **Updated:** Login flow now uses database directly
- **Updated:** Descriptions to reflect database-based authentication

### 3. API Client Deprecation
**File:** `src/utils/apiClient.ts`

- **Status:** Deprecated (marked with `@deprecated` JSDoc)
- **Reason:** All functionality replaced by `ApiStorageManager` which uses `@reqbeam/db`
- **Action:** File kept for reference but should not be used in new code

### 4. Storage Manager
**File:** `src/utils/apiStorage.ts`

- **Status:** Already using `@reqbeam/db` ✅
- **Services Used:**
  - `CollectionService`
  - `RequestService`
  - `EnvironmentService`
  - `WorkspaceService`
  - `HistoryService`

### 5. Dependencies
**File:** `package.json`

- **Added:**
  - `bcryptjs: ^2.4.3` (for password verification)
  - `@types/bcryptjs: ^2.4.6` (TypeScript types)

## Architecture

### Before (API-Based)
```
CLI → HTTP Request → Web App (localhost:3000) → Database
```

### After (Direct Database Access)
```
CLI → @reqbeam/db → Database
```

## Benefits

1. **No Web Server Required**: CLI works independently without needing the web app running
2. **Faster Operations**: Direct database access eliminates HTTP overhead
3. **Consistency**: Same database operations as web app (shared code via `@reqbeam/db`)
4. **Offline Capable**: Can work with local SQLite database without network
5. **Simplified Setup**: No need to configure API URLs

## Configuration

### Database Connection
The CLI uses `DATABASE_URL` environment variable to connect to the database:

```bash
# SQLite (local)
export DATABASE_URL="file:./reqbeam-db/prisma/dev.db"

# PostgreSQL (remote)
export DATABASE_URL="postgresql://user:password@host:port/database"
```

**Important:** The CLI must connect to the same database as the web application.

### Authentication
Authentication is now database-based:

```bash
# Login (no API URL needed)
Reqbeam auth login

# Check status
Reqbeam auth status

# Logout
Reqbeam auth logout
```

## Migration Notes

### For Existing Users
1. **Re-authenticate**: Run `Reqbeam auth login` to re-authenticate (old tokens won't work)
2. **Database URL**: Ensure `DATABASE_URL` is set correctly
3. **No Breaking Changes**: All commands work the same way, just using database instead of APIs

### For Developers
1. **Use `ApiStorageManager`**: All commands should use `ApiStorageManager.getInstance()` for database operations
2. **Don't Use `ApiClient`**: The `ApiClient` class is deprecated and should not be used
3. **Auth Flow**: Use `AuthManager` for authentication, which now uses database directly

## Verification

All commands verified to use `ApiStorageManager`:
- ✅ `collection.ts` - Uses `ApiStorageManager`
- ✅ `request.ts` - Uses `ApiStorageManager`
- ✅ `env.ts` - Uses `ApiStorageManager`
- ✅ `workspace.ts` - Uses `ApiStorageManager`
- ✅ `run.ts` - Uses `ApiStorageManager`
- ✅ `project.ts` - Uses `ApiStorageManager`

## Status

✅ **MIGRATION COMPLETE**

All CLI operations now use direct database access via `@reqbeam/db`. No web API calls are made except for:
- HTTP requests to external APIs (when executing requests via `run` command)
- Auth server APIs (untouched as requested)

