# Postmind CLI - Quick Start Guide

Get up and running with Postmind CLI in 5 minutes! 🚀

## 🏃‍♂️ Quick Setup

### 1. Build and Install

```bash
cd postmind-cli
npm install
npm run build
npm link  # Optional: install globally
```

### 2. Create Your First Project

```bash
# Initialize a new API project
postmind init my-first-api

# Verify it was created
postmind project list
```

### 3. Add an Environment

```bash
# Add development environment with variables
postmind env add development -i
```

When prompted, enter variables like:
```
BASE_URL=http://localhost:3000
API_KEY=your-dev-key-here
```

### 4. Create Your First Request

```bash
# Create a GET request
postmind request create -n "Get Users" -m GET -u "{{BASE_URL}}/users" -H "Authorization:Bearer {{API_KEY}}"

# Or create interactively
postmind request create -i
```

### 5. Run Your Request

```bash
# Execute the request
postmind run request "Get Users"
```

### 6. Generate and Run Tests

```bash
# Generate test files for all requests
postmind test generate

# Run all tests
postmind test run

# Run tests for specific request
postmind test run --request "Get Users"
```

### 7. View Execution Logs

```bash
# List recent executions
postmind logs list

# View detailed log information
postmind logs view <log_id>

# Show execution summary
postmind logs summary
```

## 🎯 Common Workflows

### Workflow 1: Basic API Testing

```bash
# 1. Create project
postmind init my-api

# 2. Add environment
postmind env add dev -i
# Enter: API_URL=https://jsonplaceholder.typicode.com

# 3. Create requests
postmind request create -n "Get Posts" -m GET -u "{{API_URL}}/posts"
postmind request create -n "Get Users" -m GET -u "{{API_URL}}/users"

# 4. Create collection
postmind collection create "JSONPlaceholder API"
postmind collection add "JSONPlaceholder API" "Get Posts"
postmind collection add "JSONPlaceholder API" "Get Users"

# 5. Run collection
postmind run collection "JSONPlaceholder API"

# 6. Generate and run tests
postmind test generate
postmind test run

# 7. View execution logs
postmind logs list
postmind logs summary
```

### Workflow 2: REST API Development

```bash
# 1. Setup project
postmind init rest-api
postmind env add development -i
# Enter: BASE_URL=http://localhost:8080,TOKEN=dev-token

# 2. Create CRUD requests
postmind request create -n "List Items" -m GET -u "{{BASE_URL}}/items" -H "Authorization:Bearer {{TOKEN}}"
postmind request create -n "Create Item" -m POST -u "{{BASE_URL}}/items" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"name":"New Item","description":"Item description"}'
postmind request create -n "Update Item" -m PUT -u "{{BASE_URL}}/items/1" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"name":"Updated Item"}'
postmind request create -n "Delete Item" -m DELETE -u "{{BASE_URL}}/items/1" -H "Authorization:Bearer {{TOKEN}}"

# 3. Organize in collection
postmind collection create "Items CRUD"
postmind collection add "Items CRUD" "List Items"
postmind collection add "Items CRUD" "Create Item"
postmind collection add "Items CRUD" "Update Item"
postmind collection add "Items CRUD" "Delete Item"

# 4. Test the API
postmind run collection "Items CRUD"

# 5. Generate and run tests
postmind test generate
postmind test run

# 6. Schedule automated testing
postmind test schedule "0 2 * * *" --name "Daily API Tests"

# 7. Monitor execution
postmind logs list
postmind logs export ./api-logs.json --format json
```

### Workflow 3: API Testing with Multiple Environments

```bash
# 1. Create project
postmind init multi-env-api

# 2. Add environments
postmind env add development -i
# Enter: API_URL=http://localhost:3000,API_KEY=dev-key

postmind env add staging -i
# Enter: API_URL=https://staging-api.example.com,API_KEY=staging-key

postmind env add production -i
# Enter: API_URL=https://api.example.com,API_KEY=prod-key

# 3. Create requests
postmind request create -n "Health Check" -m GET -u "{{API_URL}}/health"
postmind request create -n "Get Data" -m GET -u "{{API_URL}}/data" -H "Authorization:Bearer {{API_KEY}}"

# 4. Test across environments
postmind run request "Health Check" -e development
postmind run request "Health Check" -e staging
postmind run request "Health Check" -e production

# 5. Generate tests and run them
postmind test generate
postmind test run

# 6. Monitor all executions
postmind logs list --type request
postmind logs summary
```

## 🔧 Essential Commands

### Project Management
```bash
postmind init <name>           # Create new project
postmind project list          # List all projects
postmind project switch <name> # Switch project
postmind project delete <name> # Delete project
```

### Environment Management
```bash
postmind env list              # List environments
postmind env add <name> -i     # Add environment (interactive)
postmind env switch <name>     # Switch environment
postmind env remove <name>     # Remove environment
```

### Request Management
```bash
postmind request create -i     # Create request (interactive)
postmind request list          # List requests
postmind request update <name> # Update request
postmind request delete <name> # Delete request
```

### Collection Management
```bash
postmind collection create <name>                    # Create collection
postmind collection add <collection> <request>       # Add request to collection
postmind collection list                             # List collections
postmind collection export <name> <file>             # Export collection
```

### Execution
```bash
postmind run request <name>                          # Run single request
postmind run collection <name>                       # Run collection
postmind run collection <name> --parallel            # Run in parallel
postmind run history-list                            # List execution history
postmind run history <id>                            # Replay from history
```

### Testing & Automation
```bash
postmind test run                                    # Run all tests
postmind test run --request <name>                   # Run specific request tests
postmind test generate                               # Generate test files
postmind test schedule <cron>                        # Schedule test runs
postmind test schedule-list                          # List scheduled jobs
postmind test schedule-stop <id>                     # Stop scheduled job
```

### Logging & Monitoring
```bash
postmind logs list                                   # List execution logs
postmind logs view <id>                              # View log details
postmind logs export <file> --format json            # Export logs
postmind logs clear                                  # Clear all logs
postmind logs summary                                # Show statistics
```

## 💡 Pro Tips

### 1. Use Interactive Mode
```bash
# Interactive request creation is easier for complex requests
postmind request create -i
```

### 2. Save Responses for Debugging
```bash
# Save responses to history for later analysis
postmind run collection "My API" --save-response
```

### 3. Parallel Execution for Speed
```bash
# Run requests simultaneously for faster testing
postmind run collection "API Tests" --parallel
```

### 4. Environment Variables
```bash
# Use {{VARIABLE}} syntax in URLs, headers, and body
postmind request create -n "API Call" -m GET -u "{{BASE_URL}}/{{ENDPOINT}}"
```

### 5. Export Collections
```bash
# Share collections with your team
postmind collection export "My API" ./api-collection.json
```

### 6. Generate Tests Automatically
```bash
# Auto-generate test files for all requests
postmind test generate

# Run tests to verify API behavior
postmind test run
```

### 7. Schedule Automated Testing
```bash
# Run tests every hour
postmind test schedule "0 * * * *" --name "Hourly Tests"

# Run tests daily at 2 AM
postmind test schedule "0 2 * * *" --name "Daily Tests"
```

### 8. Monitor and Export Logs
```bash
# View recent executions
postmind logs list

# Export logs for analysis
postmind logs export ./logs/api-execution.json --format json

# Filter logs by type
postmind logs list --type request
```

## 🚨 Troubleshooting

### Common Issues

**"No current project" error:**
```bash
# Solution: Initialize or switch to a project
postmind init my-project
# or
postmind project switch existing-project
```

**"Environment not found" error:**
```bash
# Solution: Check available environments and switch
postmind env list
postmind env switch correct-environment
```

**"Request not found" error:**
```bash
# Solution: Check available requests
postmind request list
```

**Network errors:**
- Check your internet connection
- Verify the URL is correct
- Check if the API requires authentication

**Test failures:**
- Check test files in `tests/` directory
- Verify test assertions are correct
- Use `postmind test run --verbose` for detailed output

**Log issues:**
- Check if logs directory exists
- Verify log permissions
- Use `postmind logs clear` to reset logs

## 🎉 Next Steps

1. **Explore the full documentation** in `README.md`
2. **Try the examples** in the `examples/` directory
3. **Create your own API collections**
4. **Set up multiple environments** for different stages
5. **Use history tracking** to monitor API changes over time
6. **Generate and customize tests** for your APIs
7. **Set up automated testing** with scheduling
8. **Monitor execution logs** and export for analysis

## 📚 Additional Resources

- [Full Documentation](README.md)
- [Command Reference](README.md#commands)
- [Examples](README.md#examples)
- [Configuration](README.md#configuration)

---

**You're all set! Start building amazing API projects with Postmind CLI!** 🎊
