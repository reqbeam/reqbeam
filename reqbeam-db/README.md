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

## Development

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Build the package
npm run build
```

