---
layout: default
title: Installation Guide
---

# Installation Guide

This guide will help you install and set up Reqbeam on your system.

## Prerequisites

Before installing Reqbeam, ensure you have the following installed:

- **Node.js** version 18.0 or higher ([Download](https://nodejs.org/))
- **npm**, **yarn**, or **pnpm** package manager
- **PostgreSQL** version 14 or higher (for production) or **SQLite** (for development)
- **Git** version control system ([Download](https://git-scm.com/))

## Installation Methods

### Method 1: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/reqbeam/reqbeam.git
cd reqbeam

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### Method 2: Using Docker

```bash
# Clone the repository
git clone https://github.com/reqbeam/reqbeam.git
cd reqbeam

# Start with Docker Compose
docker-compose up -d
```

### Method 3: Automated Setup Script

```bash
# Clone the repository
git clone https://github.com/reqbeam/reqbeam.git
cd reqbeam

# Run automated setup (Linux/Mac)
chmod +x setup.sh
./setup.sh

# Or run manually
npm run setup:all
```

## Environment Configuration

### 1. Copy Environment Template

```bash
cp env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/reqbeam?schema=public"
# Or for SQLite: DATABASE_URL="file:./prisma/dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App Configuration
NEXT_PUBLIC_APP_NAME="Reqbeam"

### 3. Generate NEXTAUTH_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Database Setup

### PostgreSQL Setup

1. **Create Database**

```bash
psql -U postgres
CREATE DATABASE reqbeam;
\q
```

2. **Run Migrations**

```bash
npm run db:generate
npm run db:push
```

### SQLite Setup

1. **Update .env**

```env
DATABASE_URL="file:./prisma/dev.db"
```

2. **Run Setup**

```bash
npm run db:generate
npm run db:push
```

## CLI Installation

To install the Reqbeam CLI tool:

```bash
cd reqbeam-cli
npm install
npm run build
npm link  # Install globally

# Authenticate
reqbeam auth login
# or use alias
rb auth login
```

## Verification

### Verify Web Application

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000 in your browser

3. You should see the Reqbeam login page

### Verify CLI

```bash
reqbeam --version
# or
rb --version
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo service postgresql status  # Linux
brew services list              # Mac

# Restart PostgreSQL
sudo service postgresql restart  # Linux
brew services restart postgresql # Mac
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npm run db:generate
```

### Port Already in Use

```bash
# On Linux/Mac
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Next Steps

After installation, proceed to the [Quick Start Guide](quick-start) to begin using Reqbeam.

