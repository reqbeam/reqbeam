# Postmind CLI

A TypeScript-based CLI tool for managing API projects, environments, requests, and collections - similar to Postman CLI or Newman, but with a full project-oriented command structure.

> **Quick Tip:** You can use `pm` as a shorter alias for `postmind` in all commands!

## 🚀 Features

- **Web UI Sync**: 🔄 Real-time synchronization with Postmind web UI database
- **Cloud Storage**: All data stored in PostgreSQL database
- **Collection Management**: Organize requests into collections (synced with web UI)
- **Request Management**: Create, update, delete, and list API requests
- **Environment Management**: Manage environment variables
- **Execution**: Run individual requests or entire collections
- **History Logging**: 📊 All CLI executions automatically saved to web UI history
- **Authentication**: Secure token-based authentication
- **Testing & Automation**: Custom test framework with auto-generation and scheduling
- **Logging & Monitoring**: Comprehensive execution logging and export capabilities
- **Beautiful Output**: Colorized terminal output with progress indicators

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd postmind-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## 🏗️ Architecture

### Cloud-Based Storage
All data is now stored in the PostgreSQL database and synchronized with the web UI in real-time:

```
CLI ◄──► REST API ◄──► PostgreSQL Database ◄──► Web UI
```

- Collections, requests, and environments stored in database
- Changes reflect instantly across CLI and web UI
- Access your configurations from anywhere
- Authentication stored in `~/.postmind/auth.json`

For detailed information about sync, see [SYNC.md](./SYNC.md).

## 📋 Commands

## ⚠️ Authentication Required

**All Postmind CLI commands now require authentication.** You must log in before using any CLI functionality.

```bash
# First-time setup - login to web UI
postmind auth login
# or use the shorter alias
pm auth login

# Then you can use all other commands
postmind init my-project
# or
pm init my-project
```

For detailed authentication documentation, see [AUTH.md](./AUTH.md).

### 📊 History Tracking

All request executions from the CLI are automatically saved to the database and appear in the web UI's history tab:

```bash
# Run a request - automatically logged to history
postmind run request "Get Users"
# or with alias
pm run request "Get Users"

# Run collection - each request logged
pm run collection "User API"

# View in Web UI → History tab
# All CLI executions marked with "CLI" badge
```

For detailed history documentation, see [HISTORY.md](./HISTORY.md).

## 📋 Commands

### Project Management

```bash
# Initialize a new project
pm init <project_name>

# List all projects
pm project list

# Switch to a different project
pm project switch <project_name>

# Delete a project
postmind project delete <project_name>
```

### Environment Management

```bash
# List environments
pm env list

# Add a new environment
pm env add <name> -i  # Interactive mode

# Switch environment
pm env switch <name>

# Remove environment
pm env remove <name>
```

### Request Management

```bash
# Create a request
pm request create -n "Get Users" -m GET -u "https://api.example.com/users"

# Create request interactively
pm request create -i

# List all requests
pm request list

# Update a request
pm request update "Get Users" -u "https://api.example.com/v2/users"

# Delete a request
pm request delete "Get Users"
```

### Collection Management

```bash
# Create a collection
pm collection create "User API"

# Add request to collection
pm collection add "User API" "Get Users"

# List collections
pm collection list

# Remove request from collection
pm collection remove "User API" "Get Users"

# Export collection
pm collection export "User API" ./exported-collection.json
```

### Execution

```bash
# Run a single request
pm run request "Get Users"

# Run a collection
pm run collection "User API"

# Run collection in parallel
pm run collection "User API" --parallel

# Run with specific environment
pm run collection "User API" -e production

# Save responses
pm run collection "User API" --save-response

# List execution history
pm run history-list

# Replay from history
pm run history <history_id>
```

### Testing & Automation

```bash
# Run all tests
pm test run

# Run tests for specific request
pm test run --request "Get Users"

# Generate test skeleton files
pm test generate

# Schedule automated test runs
pm test schedule "0 * * * *" --name "Hourly Tests"

# List scheduled jobs
pm test schedule-list

# Stop scheduled job
pm test schedule-stop <job_id>

# Delete scheduled job
pm test schedule-delete <job_id>
```

### Logging & Monitoring

```bash
# List execution logs
pm logs list

# List with filtering
pm logs list --limit 10 --type request

# View detailed log information
pm logs view <log_id>

# Export logs to JSON
pm logs export ./logs/execution.json --format json

# Export logs to CSV
pm logs export ./logs/execution.csv --format csv

# Export with filtering
pm logs export ./logs/requests.json --type request --format json

# Show execution summary
pm logs summary

# Clear all logs
pm logs clear
```

## 🌍 Environment Variables

Environment variables are managed per project and can be used in requests using `{{VARIABLE_NAME}}` syntax:

```bash
# Add environment with variables
pm env add production -i
# Enter: API_URL=https://api.example.com,API_KEY=your-key-here

# Use in requests
pm request create -n "Get Users" -m GET -u "{{API_URL}}/users" -H "Authorization:Bearer {{API_KEY}}"
```

## 📝 Examples

### 1. Create a Complete API Project

```bash
# Initialize project
pm init my-api-project

# Add environments
pm env add development -i
# Enter: BASE_URL=http://localhost:3000,API_KEY=dev-key

pm env add production -i
# Enter: BASE_URL=https://api.example.com,API_KEY=prod-key

# Switch to development
pm env switch development

# Create requests
pm request create -n "Get Users" -m GET -u "{{BASE_URL}}/users" -H "Authorization:Bearer {{API_KEY}}"
pm request create -n "Create User" -m POST -u "{{BASE_URL}}/users" -b '{"name":"John","email":"john@example.com"}'

# Create collection
pm collection create "User Management"
pm collection add "User Management" "Get Users"
pm collection add "User Management" "Create User"

# Run collection
pm run collection "User Management"

# Generate and run tests
pm test generate
pm test run

# View execution logs
pm logs list
pm logs summary
```

### 2. Interactive Request Creation

```bash
pm request create -i
```

This will prompt you for:
- Request name
- HTTP method
- URL
- Headers (key:value pairs)
- Request body
- Description

### 3. Testing and Automation

```bash
# Generate test files for all requests
pm test generate

# Run all tests
pm test run

# Run tests for specific request
pm test run --request "Get Users"

# Schedule automated testing
pm test schedule "0 2 * * *" --name "Daily Tests"

# View test results in logs
pm logs list --type test
```

### 4. Export and Import Collections

```bash
# Export collection to JSON
pm collection export "User Management" ./user-api.json

# Export to YAML
pm collection export "User Management" ./user-api.yaml -f yaml

# Export execution logs
pm logs export ./logs/execution.json --format json
```

## 🎨 Output Formatting

The CLI provides beautiful, colorized output:

- **Green**: Successful operations and 2xx status codes
- **Red**: Errors and 4xx/5xx status codes
- **Yellow**: Warnings and 3xx status codes
- **Blue**: Information and timing data
- **Magenta**: PATCH requests
- **Cyan**: Headers and metadata

## 📊 History and Reporting

All executions are automatically saved to history with:
- Execution ID for replay
- Timestamp
- Duration
- Status code
- Success/failure status
- Environment used
- Response data (if `--save-response` is used)

## 🧪 Testing Framework

The CLI includes a comprehensive testing framework:

### Test Generation
- Auto-generates test skeleton files for all requests
- Creates files in `tests/` directory with naming convention `{requestName}.test.js`
- Includes example assertions and documentation

### Test Execution
- Custom test runner with Jest-like assertion syntax
- Supports `expect().toBe()`, `expect().toEqual()`, `expect().toContain()`, etc.
- Detailed test result reporting with pass/fail counts
- Individual test timing and error reporting

### Test Scheduling
- Cron-based scheduling for automated test runs
- Persistent job storage in `~/.postmind/schedules.json`
- Support for starting, stopping, and deleting scheduled jobs
- Automatic job execution on CLI startup

## 📋 Logging and Monitoring

Comprehensive logging system for execution tracking:

### Log Types
- **Request Logs**: Individual API request executions
- **Test Logs**: Test suite runs with detailed results
- **Collection Logs**: Collection execution summaries

### Log Management
- Automatic logging of all executions
- Detailed log viewing with full execution context
- Export capabilities (JSON/CSV) with filtering options
- Log statistics and success rate tracking
- Organized storage in `logs/` directory

### Export Features
- JSON export with full execution details
- CSV export for spreadsheet analysis
- Type-based filtering (request, test, collection)
- Date range filtering
- Nested directory support

## 🔧 Configuration

The CLI stores configuration in `~/.postmind/`:
- `projects/` - All project data
- `current-project` - Currently active project
- `schedules.json` - Scheduled test jobs
- `logs/` - Execution logs (local project directory)

## 🚨 Error Handling

The CLI provides comprehensive error handling:
- Network errors with retry suggestions
- Invalid URLs with format hints
- Missing projects/environments with helpful messages
- Malformed JSON with parsing details
- Test execution errors with detailed assertion information
- Log export errors with file system guidance
- Scheduling errors with cron expression validation

## 📚 Advanced Usage

### Parallel Execution

```bash
# Run all requests in a collection simultaneously
postmind run collection "API Tests" --parallel
```

### Verbose Output

```bash
# Show detailed request/response information
postmind run request "Get Users" --verbose
```

### Custom Headers

```bash
# Add multiple headers
postmind request create -n "API Call" -m GET -u "https://api.example.com/data" -H "Authorization:Bearer token,Content-Type:application/json"
```

### Test Customization

```bash
# Create custom test assertions
# Edit tests/getUsers.test.js
export default function test(response, { expect }) {
  expect(response.status).toBe(200);
  expect(response.data).toHaveProperty('users');
  expect(response.duration).toBeLessThan(1000);
}

# Run specific test
postmind test run --request "getUsers"
```

### Log Analysis

```bash
# Export logs for analysis
postmind logs export ./analysis/execution.json --format json

# Filter logs by date range
postmind logs export ./analysis/recent.json --start-date 2025-01-01 --format json

# Export only failed executions
postmind logs list --type request | grep "Failed"
```

### Automated Testing

```bash
# Schedule daily tests at 2 AM
postmind test schedule "0 2 * * *" --name "Daily API Tests"

# Schedule hourly tests
postmind test schedule "0 * * * *" --name "Hourly Health Checks"

# List all scheduled jobs
postmind test schedule-list

# Stop a scheduled job
postmind test schedule-stop <job_id>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Happy API testing with Postmind CLI!** 🚀
