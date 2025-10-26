# Postmind CLI - Quick Start Guide

## 🚀 Installation

```bash
# Navigate to CLI directory
cd postmind-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (makes 'postmind' and 'pm' available everywhere)
npm link
```

## ⚡ Using the PM Alias

**Quick Tip:** Use `pm` instead of `postmind` for faster typing!

```bash
# Both work identically
postmind --version
pm --version
```

## 🔐 Authentication (Required)

Before using any commands, you must authenticate:

```bash
# Login to your Postmind web UI
pm auth login

# You'll be prompted for:
# - API URL (e.g., http://localhost:3000)
# - Email
# - Password

# Check authentication status
pm auth status
```

## 📋 Basic Workflow

### 1. Initialize a Project

```bash
pm init my-api-project
```

### 2. Create Environments

```bash
# Add development environment
pm env add development -i
# Enter variables: BASE_URL=http://localhost:3000,API_KEY=dev-key

# Add production environment
pm env add production -i
# Enter variables: BASE_URL=https://api.example.com,API_KEY=prod-key

# List environments
pm env list

# Activate development
pm env switch development
```

### 3. Create Requests

```bash
# Interactive mode (recommended for beginners)
pm request create -i

# Or specify directly
pm request create \
  -n "Get Users" \
  -m GET \
  -u "{{BASE_URL}}/users" \
  -H "Authorization:Bearer {{API_KEY}}"

# List all requests
pm request list
```

### 4. Organize into Collections

```bash
# Create a collection
pm collection create "User API"

# Add requests to collection
pm collection add "User API" "Get Users"
pm collection add "User API" "Create User"

# List collections
pm collection list
```

### 5. Run Requests

```bash
# Run a single request
pm run request "Get Users"

# Run entire collection
pm run collection "User API"

# Run collection in parallel
pm run collection "User API" --parallel

# Run with specific environment
pm run collection "User API" -e production
```

### 6. View History

```bash
# All CLI executions are automatically saved
# View in web UI under History tab

# Or list via CLI
pm logs list
pm logs summary
```

## 📊 Common Commands

### Authentication
```bash
pm auth login      # Login to web UI
pm auth status     # Check login status
pm auth logout     # Logout
```

### Requests
```bash
pm request list              # List all requests
pm request create -i         # Create interactively
pm request delete "name"     # Delete request
```

### Collections
```bash
pm collection list           # List collections
pm collection create "name"  # Create collection
pm collection export "name"  # Export to file
```

### Environments
```bash
pm env list          # List environments
pm env add <name>    # Add environment
pm env switch <name> # Switch environment
```

### Execution
```bash
pm run request "name"              # Run single request
pm run collection "name"           # Run collection
pm run collection "name" --parallel # Run in parallel
```

### Testing
```bash
pm test generate     # Generate test files
pm test run          # Run all tests
pm test schedule     # Schedule automated tests
```

### Logs
```bash
pm logs list         # View execution logs
pm logs summary      # View summary
pm logs export       # Export logs
```

## 🎯 Example: Complete API Testing Setup

```bash
# 1. Authenticate
pm auth login

# 2. Initialize
pm init user-api-tests

# 3. Setup environments
pm env add dev -i
pm env add prod -i
pm env switch dev

# 4. Create requests
pm request create -n "Login" -m POST \
  -u "{{BASE_URL}}/auth/login" \
  -b '{"email":"test@example.com","password":"test123"}'

pm request create -n "Get Profile" -m GET \
  -u "{{BASE_URL}}/profile" \
  -H "Authorization:Bearer {{TOKEN}}"

# 5. Create collection
pm collection create "Auth Flow"
pm collection add "Auth Flow" "Login"
pm collection add "Auth Flow" "Get Profile"

# 6. Run tests
pm run collection "Auth Flow"

# 7. Generate and run automated tests
pm test generate
pm test run

# 8. Schedule daily tests
pm test schedule "0 9 * * *" --name "Daily Auth Tests"

# 9. View results
pm logs list
pm logs summary
```

## 💡 Pro Tips

### 1. Use Environment Variables

```bash
# Create environment with variables
pm env add staging -i
# Enter: BASE_URL=https://staging.api.com,API_KEY=staging-key

# Use in requests with {{VARIABLE}} syntax
pm request create -n "Test" -m GET -u "{{BASE_URL}}/test"
```

### 2. Interactive Mode

```bash
# Use -i flag for guided creation
pm request create -i
pm env add production -i
```

### 3. Parallel Execution

```bash
# Run collections faster with --parallel
pm run collection "Smoke Tests" --parallel
```

### 4. Export Collections

```bash
# Export for sharing or backup
pm collection export "User API" ./user-api.json
```

### 5. View Detailed Logs

```bash
# Filter logs
pm logs list --limit 10 --type request

# Export logs for analysis
pm logs export ./test-results.json --format json
```

## 🔍 Getting Help

```bash
# General help
pm --help

# Command-specific help
pm auth --help
pm run --help
pm request --help

# See version
pm --version
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
pm auth status

# Re-login if expired
pm auth logout
pm auth login
```

### Command Not Found

```bash
# Ensure CLI is linked
cd postmind-cli
npm link

# Verify installation
which pm
pm --version
```

### API Connection Issues

```bash
# Verify API URL in auth config
cat ~/.postmind/auth.json

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

Start testing your APIs with Postmind:

```bash
pm auth login
pm init my-project
pm request create -i
pm run request "Test"
```

Happy testing! 🚀
