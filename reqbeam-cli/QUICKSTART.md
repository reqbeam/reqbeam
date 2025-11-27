# Reqbeam CLI - Quick Start Guide

## 🚀 Installation

```bash
# Navigate to CLI directory
cd reqbeam-cli

# Install dependencies
nrb install

# Build the project
nrb run build

# Link globally (makes 'reqbeam' and 'rb' available everywhere)
nrb link
```

## ⚡ Using the PM Alias

**Quick Tip:** Use `rb` instead of `reqbeam` for faster typing!

```bash
# Both work identically
reqbeam --version
rb --version
```

## 🔐 Authentication (Required)

Before using any commands, you must authenticate:

```bash
# Login (opens the browser-based CLI login page)
rb auth login

# Check authentication status at any time
rb auth status
```

- Keep the Next.js app running locally (`cd reqbeam && nrb run dev`) while authenticating.
- The CLI launches `http://localhost:3000/auth/cli-login`; finish the form there and the CLI will store the token automatically.
- Prefer the old fully-headless flow? Provide your credentials directly:

```bash
rb auth login --email you@example.com --password superSecret --api-url http://localhost:3000
```

Add `--browser` if you explicitly want to force the browser flow (useful when also supplying email/password for autofill tools).

## 📋 Basic Workflow

### 1. List or Create Workspaces

```bash
# List existing workspaces
rb workspace list

# Create a new workspace
rb workspace create my-api-workspace

# Switch/select a workspace
rb workspace switch my-api-workspace
rb workspace select my-api-workspace

# Note: 'rb init' is deprecated - use workspace commands instead
```

### 2. Create Environments

```bash
# Add develorbent environment
rb env add develorbent -i
# Enter variables: BASE_URL=http://localhost:3000,API_KEY=dev-key

# Add production environment
rb env add production -i
# Enter variables: BASE_URL=https://api.example.com,API_KEY=prod-key

# List environments
rb env list

# Activate develorbent
rb env switch develorbent
```

### 3. Create Requests

```bash
# Interactive mode (recommended for beginners)
rb request create -i

# Or specify directly
rb request create \
  -n "Get Users" \
  -m GET \
  -u "{{BASE_URL}}/users" \
  -H "Authorization:Bearer {{API_KEY}}"

# List all requests
rb request list
```

### 4. Organize into Collections

```bash
# Create a collection
rb collection create "User API"

# Add requests to collection
rb collection add "User API" "Get Users"
rb collection add "User API" "Create User"

# List collections
rb collection list
```

### 5. Run Requests

```bash
# Run a single request
rb run request "Get Users"

# Run entire collection
rb run collection "User API"

# Run collection in parallel
rb run collection "User API" --parallel

# Run with specific environment
rb run collection "User API" -e production
```

### 6. View History

```bash
# All CLI executions are automatically saved
# View in web UI under History tab

# Or list via CLI
rb logs list
rb logs summary
```

## 📊 Common Commands

### Authentication
```bash
rb auth login      # Opens browser-based login flow
rb auth status     # Check login status
rb auth logout     # Logout
```

### Requests
```bash
rb request list              # List all requests
rb request create -i         # Create interactively
rb request delete "name"     # Delete request
```

### Collections
```bash
rb collection list           # List collections
rb collection create "name"  # Create collection
rb collection export "name"  # Export to file
```

### Environments
```bash
rb env list          # List environments
rb env add <name>    # Add environment
rb env switch <name> # Switch environment
```

### Execution
```bash
rb run request "name"              # Run single request
rb run collection "name"           # Run collection
rb run collection "name" --parallel # Run in parallel
```

### Testing
```bash
rb test generate     # Generate test files
rb test run          # Run all tests
rb test schedule     # Schedule automated tests
```

### Logs
```bash
rb logs list         # View execution logs
rb logs summary      # View summary
rb logs export       # Export logs
```

## 🎯 Example: Complete API Testing Setup

```bash
# 1. Authenticate
rb auth login          # opens browser (or pass --email/--password)

# 2. Initialize
rb init user-api-tests

# 3. Setup environments
rb env add dev -i
rb env add prod -i
rb env switch dev

# 4. Create requests
rb request create -n "Login" -m POST \
  -u "{{BASE_URL}}/auth/login" \
  -b '{"email":"test@example.com","password":"test123"}'

rb request create -n "Get Profile" -m GET \
  -u "{{BASE_URL}}/profile" \
  -H "Authorization:Bearer {{TOKEN}}"

# 5. Create collection
rb collection create "Auth Flow"
rb collection add "Auth Flow" "Login"
rb collection add "Auth Flow" "Get Profile"

# 6. Run tests
rb run collection "Auth Flow"

# 7. Generate and run automated tests
rb test generate
rb test run

# 8. Schedule daily tests
rb test schedule "0 9 * * *" --name "Daily Auth Tests"

# 9. View results
rb logs list
rb logs summary
```

## 💡 Pro Tips

### 1. Use Environment Variables

```bash
# Create environment with variables
rb env add staging -i
# Enter: BASE_URL=https://staging.api.com,API_KEY=staging-key

# Use in requests with {{VARIABLE}} syntax
rb request create -n "Test" -m GET -u "{{BASE_URL}}/test"
```

### 2. Interactive Mode

```bash
# Use -i flag for guided creation
rb request create -i
rb env add production -i
```

### 3. Parallel Execution

```bash
# Run collections faster with --parallel
rb run collection "Smoke Tests" --parallel
```

### 4. Export Collections

```bash
# Export for sharing or backup
rb collection export "User API" ./user-api.json
```

### 5. View Detailed Logs

```bash
# Filter logs
rb logs list --limit 10 --type request

# Export logs for analysis
rb logs export ./test-results.json --format json
```

## 🔍 Getting Help

```bash
# General help
rb --help

# Command-specific help
rb auth --help
rb run --help
rb request --help

# See version
rb --version
```

## 🌐 Web UI Integration

All CLI operations sync with the web UI:

- **Collections**: View and edit in web UI
- **Requests**: Manage from both CLI and web
- **History**: All CLI executions appear in web UI history tab
- **Environments**: Shared between CLI and web
- **Authentication**: Single login for both

Visit the web UI to:
- Visual request builder
- Response viewer
- History timeline
- Collection management
- Environment variables editor

## 🚨 Troubleshooting

### Authentication Issues

```bash
# Check authentication status
rb auth status

# Re-login if expired
rb auth logout
rb auth login               # browser flow
# or stay headless
rb auth login --email you@example.com --password superSecret
```

### Command Not Found

```bash
# Ensure CLI is linked
cd reqbeam-cli
nrb link

# Verify installation
which rb
rb --version
```

### API Connection Issues

```bash
# Verify API URL in auth config
cat ~/.reqbeam/auth.json

# Check web UI is running
curl http://localhost:3000/api/collections
```

## 📚 Documentation

- **README.md** - Complete feature documentation
- **AUTH.md** - Authentication guide
- **PM-ALIAS.md** - Alias reference
- **SYNC.md** - Web UI synchronization
- **HISTORY.md** - History tracking

## 🎉 You're Ready!

Start testing your APIs with Reqbeam:

```bash
rb auth login        # finish browser login
rb workspace create my-workspace
rb workspace switch my-workspace
rb request create -i
rb run request "Test"
```

Happy testing! 🚀

