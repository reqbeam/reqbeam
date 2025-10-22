# Postmind CLI

A TypeScript-based CLI tool for managing API projects, environments, requests, and collections - similar to Postman CLI or Newman, but with a full project-oriented command structure.

## 🚀 Features

- **Project Management**: Create, list, and delete API projects
- **Environment Management**: Manage environment variables per project
- **Request Management**: Create, update, delete, and list API requests
- **Collection Management**: Organize requests into collections
- **Execution**: Run individual requests or entire collections
- **History**: Track and replay past executions
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

### 3. Export and Import Collections

```bash
# Export collection to JSON
postmind collection export "User Management" ./user-api.json

# Export to YAML
postmind collection export "User Management" ./user-api.yaml -f yaml
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

## 🔧 Configuration

The CLI stores configuration in `~/.postmind/`:
- `projects/` - All project data
- `current-project` - Currently active project

## 🚨 Error Handling

The CLI provides comprehensive error handling:
- Network errors with retry suggestions
- Invalid URLs with format hints
- Missing projects/environments with helpful messages
- Malformed JSON with parsing details

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
