# Postmind CLI

A TypeScript-based CLI tool for managing API projects, environments, requests, and collections - similar to Postman CLI or Newman, but with a full project-oriented command structure.

## 🚀 Features

- **Project Management**: Create, list, and delete API projects
- **Environment Management**: Manage environment variables per project
- **Request Management**: Create, update, delete, and list API requests
- **Collection Management**: Organize requests into collections
- **Execution**: Run individual requests or entire collections
- **History**: Track and replay past executions
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

## 🏗️ Project Structure

Each project is stored in `~/.postmind/projects/<project_name>/` with the following structure:

```
~/.postmind/projects/my-api-project/
├── config.json          # Project configuration
├── requests/            # Individual request files
├── collections/         # Collection files
└── environments/        # Environment files
```

## 📋 Commands

### Project Management

```bash
# Initialize a new project
postmind init <project_name>

# List all projects
postmind project list

# Switch to a different project
postmind project switch <project_name>

# Delete a project
postmind project delete <project_name>
```

### Environment Management

```bash
# List environments
postmind env list

# Add a new environment
postmind env add <name> -i  # Interactive mode

# Switch environment
postmind env switch <name>

# Remove environment
postmind env remove <name>
```

### Request Management

```bash
# Create a request
postmind request create -n "Get Users" -m GET -u "https://api.example.com/users"

# Create request interactively
postmind request create -i

# List all requests
postmind request list

# Update a request
postmind request update "Get Users" -u "https://api.example.com/v2/users"

# Delete a request
postmind request delete "Get Users"
```

### Collection Management

```bash
# Create a collection
postmind collection create "User API"

# Add request to collection
postmind collection add "User API" "Get Users"

# List collections
postmind collection list

# Remove request from collection
postmind collection remove "User API" "Get Users"

# Export collection
postmind collection export "User API" ./exported-collection.json
```

### Execution

```bash
# Run a single request
postmind run request "Get Users"

# Run a collection
postmind run collection "User API"

# Run collection in parallel
postmind run collection "User API" --parallel

# Run with specific environment
postmind run collection "User API" -e production

# Save responses
postmind run collection "User API" --save-response

# List execution history
postmind run history-list

# Replay from history
postmind run history <history_id>
```

### Testing & Automation

```bash
# Run all tests
postmind test run

# Run tests for specific request
postmind test run --request "Get Users"

# Generate test skeleton files
postmind test generate

# Schedule automated test runs
postmind test schedule "0 * * * *" --name "Hourly Tests"

# List scheduled jobs
postmind test schedule-list

# Stop scheduled job
postmind test schedule-stop <job_id>

# Delete scheduled job
postmind test schedule-delete <job_id>
```

### Logging & Monitoring

```bash
# List execution logs
postmind logs list

# List with filtering
postmind logs list --limit 10 --type request

# View detailed log information
postmind logs view <log_id>

# Export logs to JSON
postmind logs export ./logs/execution.json --format json

# Export logs to CSV
postmind logs export ./logs/execution.csv --format csv

# Export with filtering
postmind logs export ./logs/requests.json --type request --format json

# Show execution summary
postmind logs summary

# Clear all logs
postmind logs clear
```

## 🌍 Environment Variables

Environment variables are managed per project and can be used in requests using `{{VARIABLE_NAME}}` syntax:

```bash
# Add environment with variables
postmind env add production -i
# Enter: API_URL=https://api.example.com,API_KEY=your-key-here

# Use in requests
postmind request create -n "Get Users" -m GET -u "{{API_URL}}/users" -H "Authorization:Bearer {{API_KEY}}"
```

## 📝 Examples

### 1. Create a Complete API Project

```bash
# Initialize project
postmind init my-api-project

# Add environments
postmind env add development -i
# Enter: BASE_URL=http://localhost:3000,API_KEY=dev-key

postmind env add production -i
# Enter: BASE_URL=https://api.example.com,API_KEY=prod-key

# Switch to development
postmind env switch development

# Create requests
postmind request create -n "Get Users" -m GET -u "{{BASE_URL}}/users" -H "Authorization:Bearer {{API_KEY}}"
postmind request create -n "Create User" -m POST -u "{{BASE_URL}}/users" -b '{"name":"John","email":"john@example.com"}'

# Create collection
postmind collection create "User Management"
postmind collection add "User Management" "Get Users"
postmind collection add "User Management" "Create User"

# Run collection
postmind run collection "User Management"

# Generate and run tests
postmind test generate
postmind test run

# View execution logs
postmind logs list
postmind logs summary
```

### 2. Interactive Request Creation

```bash
postmind request create -i
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
postmind test generate

# Run all tests
postmind test run

# Run tests for specific request
postmind test run --request "Get Users"

# Schedule automated testing
postmind test schedule "0 2 * * *" --name "Daily Tests"

# View test results in logs
postmind logs list --type test
```

### 4. Export and Import Collections

```bash
# Export collection to JSON
postmind collection export "User Management" ./user-api.json

# Export to YAML
postmind collection export "User Management" ./user-api.yaml -f yaml

# Export execution logs
postmind logs export ./logs/execution.json --format json
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
