# Setup Instructions for @reqbeam/db Package

This document provides step-by-step instructions to set up and use the shared database package.

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Access to the database (SQLite file or PostgreSQL connection)

## Step 1: Build the Database Package

```bash
cd oss-main/reqbeam-db
npm install
npm run build
npm run db:generate
```

This will:
- Install dependencies
- Compile TypeScript to JavaScript
- Generate Prisma client

## Step 2: Install in Web Application

```bash
cd oss-main
npm install
```

The web application's `package.json` already includes `@reqbeam/db` as a local dependency.

## Step 3: Install in CLI

```bash
cd oss-main/reqbeam-cli
npm install
npm run build
```

The CLI's `package.json` already includes `@reqbeam/db` as a local dependency.

## Step 4: Configure Database URL

Both the web application and CLI need to connect to the same database.

### For SQLite (Development)

Create or update `.env` file in `oss-main/`:

```env
DATABASE_URL="file:./prisma/dev.db"
```

### For PostgreSQL (Production)

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

### For CLI

Set the environment variable:

```bash
export DATABASE_URL="file:./prisma/dev.db"
```

Or add it to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
echo 'export DATABASE_URL="file:./prisma/dev.db"' >> ~/.bashrc
source ~/.bashrc
```

## Step 5: Run Database Migrations

If you're setting up a new database:

```bash
cd oss-main
npm run db:push
# or
npm run db:migrate
```

## Step 6: Verify Installation

### Web Application

Start the development server:

```bash
cd oss-main
npm run dev
```

The web application should start without errors.

### CLI

Test the CLI:

```bash
cd oss-main/reqbeam-cli
npm run build
Reqbeam --help
```

## Usage Examples

### In Web Application (API Routes)

```typescript
import { prisma, CollectionService } from '@reqbeam/db';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  const collectionService = new CollectionService(prisma);
  const collections = await collectionService.getCollections(user.id);
  return NextResponse.json(collections);
}
```

### In CLI

```typescript
import { DatabaseManager } from './utils/db.js';
import { CollectionService } from '@reqbeam/db';

const dbManager = DatabaseManager.getInstance();
const prisma = await dbManager.getPrisma();
const userId = await dbManager.getCurrentUserId();

const collectionService = new CollectionService(prisma);
const collections = await collectionService.getCollections(userId);
```

## Troubleshooting

### Error: Cannot find module '@reqbeam/db'

1. Make sure you've built the package:
   ```bash
   cd oss-main/reqbeam-db
   npm run build
   ```

2. Make sure you've installed dependencies in the consuming project:
   ```bash
   cd oss-main
   npm install
   ```

### Error: Prisma Client not generated

Run:
```bash
cd oss-main/reqbeam-db
npm run db:generate
```

### Error: DATABASE_URL not found

Make sure you've set the `DATABASE_URL` environment variable. See Step 4 above.

### Error: Database connection failed

1. Check that the database file exists (for SQLite)
2. Check that the database server is running (for PostgreSQL)
3. Verify the connection string is correct
4. Check network connectivity (for remote databases)

## Development Workflow

### Making Changes to the Package

1. Edit files in `oss-main/reqbeam-db/src/`
2. Rebuild the package:
   ```bash
   cd oss-main/reqbeam-db
   npm run build
   ```
3. The changes will be available in web and CLI after rebuilding

### Adding New Services

1. Create a new service file in `oss-main/reqbeam-db/src/services/`
2. Export it from `oss-main/reqbeam-db/src/services/index.ts`
3. Export it from `oss-main/reqbeam-db/src/index.ts`
4. Rebuild the package

### Updating Prisma Schema

1. Edit `oss-main/reqbeam-db/prisma/schema.prisma`
2. Also update `oss-main/prisma/schema.prisma` (they should be identical)
3. Run migrations:
   ```bash
   cd oss-main
   npm run db:migrate
   ```
4. Regenerate Prisma client:
   ```bash
   cd oss-main/reqbeam-db
   npm run db:generate
   ```

## Project Structure

```
oss-main/
├── reqbeam-db/          # Shared database package
│   ├── src/
│   │   ├── client.ts     # Prisma client initialization
│   │   ├── services/      # Database service classes
│   │   ├── types/        # TypeScript type definitions
│   │   └── index.ts      # Main exports
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
├── src/                  # Web application
│   └── app/api/          # API routes (use @reqbeam/db)
└── reqbeam-cli/         # CLI application
    └── src/
        └── utils/        # Utilities (use @reqbeam/db)
```

## Next Steps

- See `IMPLEMENTATION_PHASES.md` for the complete implementation plan
- See `CLI_MIGRATION.md` for CLI-specific migration details
- See `README.md` for package documentation

