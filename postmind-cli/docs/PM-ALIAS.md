# PM Alias - Quick Command Reference

## Overview

You can now use **`pm`** as a shorter alias for **`postmind`** in all CLI commands!

```bash
# Both are equivalent
postmind run request "Get Users"
pm run request "Get Users"
```

## Why Use PM?

- **Faster to type**: 2 characters vs 8
- **Less verbose**: Cleaner command line history
- **More convenient**: Quick iteration during development

## Setup

After installing or linking the CLI, both commands are automatically available:

```bash
# Install/Link (if not already done)
cd postmind-cli
npm install
npm run build
npm link

# Both commands now work
postmind --version
pm --version
```

## Command Equivalence

Every `postmind` command has a `pm` equivalent:

### Authentication
```bash
postmind auth login     →  pm auth login
postmind auth logout    →  pm auth logout
postmind auth status    →  pm auth status
```

### Workspace Management
```bash
postmind init my-project            →  pm init my-project (deprecated)
postmind workspace list             →  pm workspace list
postmind workspace create my-ws    →  pm workspace create my-ws
postmind workspace switch dev       →  pm workspace switch dev
postmind workspace activate dev     →  pm workspace activate dev
postmind workspace delete old-ws    →  pm workspace delete old-ws

# Deprecated (still works for backward compatibility)
postmind project list               →  pm project list
postmind project switch dev         →  pm project switch dev
```

### Request Management
```bash
postmind request list           →  pm request list
postmind request create -i      →  pm request create -i
postmind request delete "Test"  →  pm request delete "Test"
```

### Collection Management
```bash
postmind collection list          →  pm collection list
postmind collection create "API"  →  pm collection create "API"
postmind collection export "API"  →  pm collection export "API"
```

### Environment Management
```bash
postmind env list         →  pm env list
postmind env add prod     →  pm env add prod
postmind env switch dev   →  pm env switch dev
```

### Execution
```bash
postmind run request "Get Users"       →  pm run request "Get Users"
postmind run collection "User API"     →  pm run collection "User API"
postmind run collection "API" --parallel  →  pm run collection "API" --parallel
```

### Testing
```bash
postmind test run                      →  pm test run
postmind test generate                 →  pm test generate
postmind test schedule "0 * * * *"     →  pm test schedule "0 * * * *"
```

### Logging
```bash
postmind logs list         →  pm logs list
postmind logs summary      →  pm logs summary
postmind logs export ./log →  pm logs export ./log
```

## Quick Start Example

```bash
# Login
pm auth login

# Initialize project
pm init my-api

# Create request
pm request create -n "Users" -m GET -u "https://api.example.com/users"

# Add to collection
pm collection create "API"
pm collection add "API" "Users"

# Run it
pm run request "Users"

# View history
pm logs list
```

## Help Commands

Both work identically:

```bash
postmind --help          →  pm --help
postmind auth --help     →  pm auth --help
postmind run --help      →  pm run --help
```

## Implementation Details

### Binary Configuration

Both binaries point to the same JavaScript entry point:

**package.json**:
```json
{
  "bin": {
    "postmind": "./bin/postmind.js",
    "pm": "./bin/pm.js"
  }
}
```

### Program Configuration

The CLI registers `pm` as an alias in Commander.js:

**src/index.ts**:
```typescript
program
  .name('postmind')
  .alias('pm')
  .description('...')
  .addHelpText('after', '\nAlias: You can also use "pm" instead of "postmind"')
```

## Verification

Test that both commands work:

```bash
# Check installation
which postmind
which pm

# Check version
postmind --version
pm --version

# Should show the same version

# Test a simple command
pm auth status
```

## Common Usage Patterns

### Development Workflow
```bash
pm auth login
pm init test-api
pm request create -i
pm run request "Test"
pm logs list
```

### Testing Workflow
```bash
pm test generate
pm test run
pm test schedule "0 */6 * * *" --name "API Health Check"
pm test schedule-list
```

### Environment Management
```bash
pm env add development -i
pm env add staging -i
pm env add production -i
pm env switch development
pm run collection "Smoke Tests"
```

### Collection Management
```bash
pm collection create "Auth API"
pm collection add "Auth API" "Login"
pm collection add "Auth API" "Logout"
pm collection add "Auth API" "Refresh Token"
pm run collection "Auth API"
```

## Tips

1. **Shell Aliases**: Create even shorter aliases in your shell:
   ```bash
   # In ~/.bashrc or ~/.zshrc
   alias pmr="pm run request"
   alias pmc="pm run collection"
   
   # Then use:
   pmr "Get Users"
   pmc "User API"
   ```

2. **Tab Completion**: Both `postmind` and `pm` support tab completion (if configured)

3. **Scripts**: Use `pm` in scripts for brevity:
   ```bash
   #!/bin/bash
   pm auth login
   pm run collection "Smoke Tests"
   pm logs export ./results.json
   ```

4. **CI/CD**: Use either command in CI/CD pipelines:
   ```yaml
   # GitHub Actions
   - name: Run API Tests
     run: |
       pm auth login
       pm test run
       pm logs export ./test-results.json
   ```

## Documentation

The following documentation files have been updated to use `pm`:
- `README.md` - Main documentation with all command examples
- `AUTH.md` - Authentication documentation
- `SYNC.md` - Web UI synchronization documentation
- `HISTORY.md` - History tracking documentation

## Backward Compatibility

The full `postmind` command continues to work exactly as before. Both commands:
- Share the same configuration (`~/.postmind/`)
- Use the same authentication
- Access the same data
- Produce identical output

Choose whichever you prefer - they're completely interchangeable!

## Summary

✅ **`pm`** is now available as an alias for **`postmind`**  
✅ All commands work identically  
✅ Same configuration and data  
✅ Faster and more convenient  
✅ Fully backward compatible  

Enjoy the shorter commands! 🚀

