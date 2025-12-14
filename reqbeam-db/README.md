# @reqbeam/db

Shared database operations package for Reqbeam CLI and Web applications.

## Overview

This package provides a unified interface for database operations, ensuring consistency between the CLI and Web applications. It abstracts Prisma operations into service layers that can be used by both applications.

## Installation

```bash
npm install @reqbeam/db
```

## Usage

### Basic Setup

```typescript
import { prisma } from '@reqbeam/db';
import { CollectionService } from '@reqbeam/db/services/collections';

// Use the shared Prisma client
const collections = await prisma.collection.findMany();

// Or use the service layer
const collectionService = new CollectionService(prisma);
const allCollections = await collectionService.getCollections(userId, workspaceId);
```

### For CLI (with custom database URL)

```typescript
import { initializePrisma } from '@reqbeam/db';
import { CollectionService } from '@reqbeam/db/services/collections';

const dbUrl = process.env.DATABASE_URL;
const prisma = initializePrisma(dbUrl);
const collectionService = new CollectionService(prisma);
```

## Services

- `CollectionService` - Collection CRUD operations
- `RequestService` - Request CRUD operations
- `EnvironmentService` - Environment CRUD operations
- `WorkspaceService` - Workspace CRUD operations
- `HistoryService` - API history operations
- `MockServerService` - Mock server operations

## VS Code Extension Database Support

This package automatically supports connecting to VS Code extension databases. The database is located at:

- **Windows**: `%APPDATA%\Code\User\globalStorage\reqbeam.reqbeam\reqbeam.db`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/reqbeam.reqbeam/reqbeam.db`
- **Linux**: `~/.config/Code/User/globalStorage/reqbeam.reqbeam/reqbeam.db`

### Automatic Detection

If `DATABASE_URL` is not set, the Prisma commands (`db:push`, `db:migrate`, etc.) will automatically use the VS Code extension database.

### Manual Configuration

You can also explicitly enable VS Code extension database by setting in your `.env` file:

```env
USE_VSCODE_EXTENSION_DB=true
VSCODE_EXTENSION_ID="reqbeam.reqbeam"
VSCODE_DB_FILE_NAME="reqbeam.db"
```

Or set `DATABASE_URL` directly:

```env
DATABASE_URL="file:C:/Users/YourUsername/AppData/Roaming/Code/User/globalStorage/reqbeam.reqbeam/reqbeam.db"
```

### Get VS Code Extension Database URL

To get the exact database URL for your system:

```bash
npm run db:vscode-url
```

This will output the database URL that you can use in your `.env` file.

## Development

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (automatically uses VS Code extension DB if DATABASE_URL not set)
npm run db:push

# Run migrations (automatically uses VS Code extension DB if DATABASE_URL not set)
npm run db:migrate

# Open Prisma Studio (automatically uses VS Code extension DB if DATABASE_URL not set)
npm run db:studio

# Get VS Code extension database URL
npm run db:vscode-url

# Build the package
npm run build
```

