# PM Alias - Quick Command Reference

## Overview

You can now use **`rb`** as a shorter alias for **`reqbeam`** in all CLI commands!

```bash
# Both are equivalent
reqbeam run request "Get Users"
rb run request "Get Users"
```

## Why Use RB?

- **Faster to type**: 2 characters vs 8
- **Less verbose**: Cleaner command line history
- **More convenient**: Quick iteration during develorbent

## Setup

After installing or linking the CLI, both commands are automatically available:

```bash
# Install/Link (if not already done)
cd reqbeam-cli
nrb install
nrb run build
nrb link

# Both commands now work
reqbeam --version
rb --version
```

## Command Equivalence

Every `reqbeam` command has a `rb` equivalent:

### Authentication
```bash
reqbeam auth login     →  rb auth login
reqbeam auth logout    →  rb auth logout
reqbeam auth status    →  rb auth status
```

### Workspace Management
```bash
reqbeam init my-project              →  rb init my-project (deprecated)
reqbeam workspace list               →  rb workspace list
reqbeam workspace create my-ws       →  rb workspace create my-ws
reqbeam workspace switch dev         →  rb workspace switch dev
reqbeam workspace select dev         →  rb workspace select dev
reqbeam workspace activate dev       →  rb workspace activate dev
reqbeam workspace delete old-ws      →  rb workspace delete old-ws

# Deprecated (still works for backward compatibility)
reqbeam project list               →  rb project list
reqbeam project switch dev         →  rb project switch dev
```

### Request Management
```bash
reqbeam request list           →  rb request list
reqbeam request create -i      →  rb request create -i
reqbeam request delete "Test"  →  rb request delete "Test"
```

### Collection Management
```bash
reqbeam collection list          →  rb collection list
reqbeam collection create "API"  →  rb collection create "API"
reqbeam collection export "API"  →  rb collection export "API"
```

### Environment Management
```bash
reqbeam env list         →  rb env list
reqbeam env add prod     →  rb env add prod
reqbeam env switch dev   →  rb env switch dev
```

### Execution
```bash
reqbeam run request "Get Users"       →  rb run request "Get Users"
reqbeam run collection "User API"     →  rb run collection "User API"
reqbeam run collection "API" --parallel  →  rb run collection "API" --parallel
```

### Testing
```bash
reqbeam test run                      →  rb test run
reqbeam test generate                 →  rb test generate
reqbeam test schedule "0 * * * *"     →  rb test schedule "0 * * * *"
```

### Logging
```bash
reqbeam logs list         →  rb logs list
reqbeam logs summary      →  rb logs summary
reqbeam logs export ./log →  rb logs export ./log
```

## Quick Start Example

```bash
# Login
rb auth login

# Initialize project
rb init my-api

# Create request
rb request create -n "Users" -m GET -u "https://api.example.com/users"

# Add to collection
rb collection create "API"
rb collection add "API" "Users"

# Run it
rb run request "Users"

# View history
rb logs list
```

## Help Commands

Both work identically:

```bash
reqbeam --help          →  rb --help
reqbeam auth --help     →  rb auth --help
reqbeam run --help      →  rb run --help
```

## Implementation Details

### Binary Configuration

Both binaries point to the same JavaScript entry point:

**package.json**:
```json
{
  "bin": {
    "reqbeam": "./bin/reqbeam.js",
    "rb": "./bin/rb.js"
  }
}
```

### Program Configuration

The CLI registers `rb` as an alias in Commander.js:

**src/index.ts**:
```typescript
program
  .name('reqbeam')
  .alias('rb')
  .description('...')
  .addHelpText('after', '\nAlias: You can also use "rb" instead of "reqbeam"')
```

## Verification

Test that both commands work:

```bash
# Check installation
which reqbeam
which rb

# Check version
reqbeam --version
rb --version

# Should show the same version

# Test a simple command
rb auth status
```

## Common Usage Patterns

### Develorbent Workflow
```bash
rb auth login
rb init test-api
rb request create -i
rb run request "Test"
rb logs list
```

### Testing Workflow
```bash
rb test generate
rb test run
rb test schedule "0 */6 * * *" --name "API Health Check"
rb test schedule-list
```

### Environment Management
```bash
rb env add develorbent -i
rb env add staging -i
rb env add production -i
rb env switch develorbent
rb run collection "Smoke Tests"
```

### Collection Management
```bash
rb collection create "Auth API"
rb collection add "Auth API" "Login"
rb collection add "Auth API" "Logout"
rb collection add "Auth API" "Refresh Token"
rb run collection "Auth API"
```

## Tips

1. **Shell Aliases**: Create even shorter aliases in your shell:
   ```bash
   # In ~/.bashrc or ~/.zshrc
   alias rbr="rb run request"
   alias rbc="rb run collection"
   
   # Then use:
   rbr "Get Users"
   rbc "User API"
   ```

2. **Tab Completion**: Both `reqbeam` and `rb` support tab completion (if configured)

3. **Scripts**: Use `rb` in scripts for brevity:
   ```bash
   #!/bin/bash
   rb auth login
   rb run collection "Smoke Tests"
   rb logs export ./results.json
   ```

4. **CI/CD**: Use either command in CI/CD pipelines:
   ```yaml
   # GitHub Actions
   - name: Run API Tests
     run: |
       rb auth login
       rb test run
       rb logs export ./test-results.json
   ```

## Documentation

The following documentation files have been updated to use `rb`:
- `README.md` - Main documentation with all command examples
- `AUTH.md` - Authentication documentation
- `SYNC.md` - Web UI synchronization documentation
- `HISTORY.md` - History tracking documentation

## Backward Compatibility

The full `reqbeam` command continues to work exactly as before. Both commands:
- Share the same configuration (`~/.reqbeam/`)
- Use the same authentication
- Access the same data
- Produce identical output

Choose whichever you prefer - they're completely interchangeable!

## Summary

✅ **`rb`** is now available as an alias for **`reqbeam`**  
✅ All commands work identically  
✅ Same configuration and data  
✅ Faster and more convenient  
✅ Fully backward compatible  

Enjoy the shorter commands! 🚀

