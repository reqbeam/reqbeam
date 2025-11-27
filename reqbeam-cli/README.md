# Reqbeam CLI

A TypeScript-based CLI tool for managing API projects, environments, requests, and collections - similar to other API testing tools CLI or Newman, but with a full project-oriented command structure.

> **Quick Tip:** You can use `rb` as a shorter alias for `reqbeam` in all commands!

## 🚀 Features

- **Web UI Sync**: 🔄 Real-time synchronization with Reqbeam web UI database
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
cd reqbeam-cli

# Install dependencies
nrb install

# Build the project
nrb run build

# Link globally (optional)
nrb link
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
- Authentication stored in `~/.reqbeam/auth.json`

For detailed information about sync, see [SYNC.md](./SYNC.md).

## 📋 Commands

## ⚠️ Authentication Required

**All Reqbeam CLI commands now require authentication.** You must log in before using any CLI functionality.

```bash
# First-time setup - login and complete auth in the browser
reqbeam auth login
# or use the shorter alias
rb auth login
```

- The command launches `http://localhost:3000/auth/cli-login` in your default browser.
- Finish the form there; the CLI watches for completion and stores the token automatically.
- Make sure the Next.js app is running (`cd reqbeam && nrb run dev`) before logging in.

Need to log in without opening a browser (CI, SSH boxes, etc.)? Pass your credentials explicitly:

```bash
rb auth login --email user@example.com --password mypass
```

You can also point to a different API origin:

```bash
rb auth login --api-url https://reqbeam.internal
# combine with --email/--password if you want to bypass the browser flow
```

After you are authenticated you can run the rest of the commands, for example:

```bash
rb init my-project
```

For detailed authentication documentation, see [AUTH.md](./AUTH.md).

### 📊 History Tracking

All request executions from the CLI are automatically saved to the database and appear in the web UI's history tab:

```bash
# Run a request - automatically logged to history
reqbeam run request "Get Users"
# or with alias
rb run request "Get Users"

# Run collection - each request logged
rb run collection "User API"

# View in Web UI → History tab
# All CLI executions marked with "CLI" badge
```

For detailed history documentation, see [HISTORY.md](./HISTORY.md).

## 📋 Commands

### Project Management

```bash
# Initialize a new project
rb init <project_name>

# List all workspaces
rb workspace list

# Create a new workspace
rb workspace create <name> [-d <description>] [-i]

# Switch/select a workspace
rb workspace switch <name>
rb workspace select <name>

# Activate a workspace (alias for switch)
rb workspace activate <name>

# Delete a workspace
rb workspace delete <name> [-f]

# Note: "project" commands are deprecated but still work for backward compatibility
```

### Environment Management

```bash
# List environments
rb env list

# Add a new environment
rb env add <name> -i  # Interactive mode

# Switch environment
rb env switch <name>

# Update environment variables
rb env update <name> -a "key=value" -r "oldKey"

# Remove environment
rb env remove <name>
```

For detailed environment documentation, see [ENVIRONMENT.md](./docs/ENVIRONMENT.md).

### Request Management

```bash
# Create a request
rb request create -n "Get Users" -m GET -u "https://api.example.com/users"

# Create request interactively
rb request create -i

# List all requests
rb request list

# Update a request
rb request update "Get Users" -u "https://api.example.com/v2/users"

# Delete a request
rb request delete "Get Users"
```

### Collection Management

```bash
# Create a collection
rb collection create "User API"

# Add request to collection
rb collection add "User API" "Get Users"

# List collections
rb collection list

# Remove request from collection
rb collection remove "User API" "Get Users"

# Export collection
rb collection export "User API" ./exported-collection.json
```

### Execution

```bash
# Run a single request
rb run request "Get Users"

# Run a collection
rb run collection "User API"

# Run collection in parallel
rb run collection "User API" --parallel

# Run with specific environment
rb run collection "User API" -e production

# Save responses
rb run collection "User API" --save-response

# List execution history
rb run history-list

# Replay from history
rb run history <history_id>
```

### Testing & Automation

```bash
# Run all tests
rb test run

# Run tests for specific request
rb test run --request "Get Users"

# Generate test skeleton files
rb test generate

# Schedule automated test runs
rb test schedule "0 * * * *" --name "Hourly Tests"

# List scheduled jobs
rb test schedule-list

# Stop scheduled job
rb test schedule-stop <job_id>

# Delete scheduled job
rb test schedule-delete <job_id>
```

### Logging & Monitoring

```bash
# List execution logs
rb logs list

# List with filtering
rb logs list --limit 10 --type request

# View detailed log information
rb logs view <log_id>

# Export logs to JSON
rb logs export ./logs/execution.json --format json

# Export logs to CSV
rb logs export ./logs/execution.csv --format csv

# Export with filtering
rb logs export ./logs/requests.json --type request --format json

# Show execution summary
rb logs summary

# Clear all logs
rb logs clear
```

## 🌍 Environment Variables

Environment variables are managed per project and can be used in requests using `{{VARIABLE_NAME}}` syntax:

```bash
# Add environment with variables
rb env add production -i
# Enter: API_URL=https://api.example.com,API_KEY=your-key-here

# Use in requests
rb request create -n "Get Users" -m GET -u "{{API_URL}}/users" -H "Authorization:Bearer {{API_KEY}}"
```

## 📝 Examples

### 1. Create a Complete API Project

```bash
# Initialize project
rb init my-api-project

# Add environments
rb env add develorbent -i
# Enter: BASE_URL=http://localhost:3000,API_KEY=dev-key

rb env add production -i
# Enter: BASE_URL=https://api.example.com,API_KEY=prod-key

# Switch to develorbent
rb env switch develorbent

# Create requests
rb request create -n "Get Users" -m GET -u "{{BASE_URL}}/users" -H "Authorization:Bearer {{API_KEY}}"
rb request create -n "Create User" -m POST -u "{{BASE_URL}}/users" -b '{"name":"John","email":"john@example.com"}'

# Create collection
rb collection create "User Management"
rb collection add "User Management" "Get Users"
rb collection add "User Management" "Create User"

# Run collection
rb run collection "User Management"

# Generate and run tests
rb test generate
rb test run

# View execution logs
rb logs list
rb logs summary
```

### 2. Interactive Request Creation

```bash
rb request create -i
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
rb test generate

# Run all tests
rb test run

# Run tests for specific request
rb test run --request "Get Users"

# Schedule automated testing
rb test schedule "0 2 * * *" --name "Daily Tests"

# View test results in logs
rb logs list --type test
```

### 4. Export and Import Collections

```bash
# Export collection to JSON
rb collection export "User Management" ./user-api.json

# Export to YAML
rb collection export "User Management" ./user-api.yaml -f yaml

# Export execution logs
rb logs export ./logs/execution.json --format json
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
- Persistent job storage in `~/.reqbeam/schedules.json`
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

The CLI stores configuration in `~/.reqbeam/`:
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
reqbeam run collection "API Tests" --parallel
```

### Verbose Output

```bash
# Show detailed request/response information
reqbeam run request "Get Users" --verbose
```

### Custom Headers

```bash
# Add multiple headers
reqbeam request create -n "API Call" -m GET -u "https://api.example.com/data" -H "Authorization:Bearer token,Content-Type:application/json"
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
reqbeam test run --request "getUsers"
```

### Log Analysis

```bash
# Export logs for analysis
reqbeam logs export ./analysis/execution.json --format json

# Filter logs by date range
reqbeam logs export ./analysis/recent.json --start-date 2025-01-01 --format json

# Export only failed executions
reqbeam logs list --type request | grep "Failed"
```

### Automated Testing

```bash
# Schedule daily tests at 2 AM
reqbeam test schedule "0 2 * * *" --name "Daily API Tests"

# Schedule hourly tests
reqbeam test schedule "0 * * * *" --name "Hourly Health Checks"

# List all scheduled jobs
reqbeam test schedule-list

# Stop a scheduled job
reqbeam test schedule-stop <job_id>
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

**Happy API testing with Reqbeam CLI!** 🚀
