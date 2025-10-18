# Installation & Setup Guide

## 📦 Installation

### Option 1: Global Installation (Recommended)

Install the CLI globally to use `apicli` command from anywhere:

```bash
# Navigate to CLI directory
cd cli

# Install dependencies (if not already done)
npm install

# Build the project (if not already done)
npm run build

# Link globally
npm link
```

Now you can use `apicli` from anywhere:

```bash
apicli --help
apicli get https://api.example.com/users
```

### Option 2: Local Usage

If you prefer not to install globally:

```bash
# Navigate to CLI directory
cd cli

# Install dependencies
npm install

# Build the project
npm run build

# Use with node
node dist/index.js --help
node dist/index.js get https://api.example.com/users
```

### Option 3: Development Mode

For development with auto-recompilation:

```bash
# Terminal 1 - Watch mode (auto-compile on changes)
npm run dev

# Terminal 2 - Test your changes
node dist/index.js test examples/test-collection.json
```

## ✅ Verify Installation

After installation, verify everything works:

```bash
# Check version and help
apicli --version
apicli --help

# Test with a simple GET request
apicli get https://jsonplaceholder.typicode.com/users/1

# Run example test collection
apicli test examples/test-collection.json
```

Expected output:
- ✅ Color-coded status messages
- ✅ Formatted JSON response
- ✅ Test results in a table
- ✅ Summary statistics

## 🎯 Quick Test

Run this command to see the CLI in action:

```bash
apicli test examples/test-collection.json -r test-report.html
```

This will:
1. Run 6 API tests
2. Display results with colors
3. Generate an HTML report
4. Show pass/fail summary

## 📚 Next Steps

1. **Read the README**: `README.md` - Full documentation
2. **Try Quick Start**: `QUICKSTART.md` - Get started in 5 minutes
3. **See Examples**: `EXAMPLES.md` - Real-world usage examples
4. **Check Summary**: `CLI-SUMMARY.md` - Complete feature list

## 🛠️ Troubleshooting

### Issue: `npm link` permission error

**Solution (Windows):**
```bash
# Run PowerShell as Administrator
npm link
```

**Solution (Mac/Linux):**
```bash
sudo npm link
```

### Issue: Command not found after `npm link`

**Solution:**
```bash
# Check npm global bin path
npm config get prefix

# Add to PATH if needed (example)
export PATH="$PATH:/usr/local/bin"  # Mac/Linux
# or add to ~/.bashrc or ~/.zshrc
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Issue: Module not found errors

**Solution:**
Ensure you're using Node.js 18 or higher:
```bash
node --version  # Should be v18.0.0 or higher
```

## 📋 Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Operating System**: Windows, macOS, or Linux

## 🔧 Project Structure

After installation, you'll have:

```
cli/
├── src/              # TypeScript source code
├── dist/             # Compiled JavaScript (after build)
├── bin/              # Executable entry point
├── examples/         # Example collections
├── node_modules/     # Dependencies
├── package.json      # Project configuration
├── tsconfig.json     # TypeScript configuration
├── README.md         # Full documentation
├── QUICKSTART.md     # Quick start guide
├── EXAMPLES.md       # Usage examples
└── CLI-SUMMARY.md    # Feature summary
```

## 🚀 Usage Examples

### Basic Commands

```bash
# GET request
apicli get https://api.example.com/users

# POST request
apicli post https://api.example.com/users -d '{"name":"John"}'

# Run collection
apicli run collection.json

# Run tests
apicli test collection.json

# Generate HTML report
apicli test collection.json -r report.html

# Use environment variables
apicli test collection.json -e .env

# Interactive mode
apicli interactive
```

### Advanced Usage

```bash
# Verbose output with headers
apicli get https://api.example.com/users -v

# Multiple headers
apicli get https://api.example.com/protected \
  -H "Authorization: Bearer token" \
  -H "X-Custom: value"

# Environment and report together
apicli test tests.json -e production.env -r prod-report.html

# YAML collection
apicli test tests.yaml
```

## 🎓 Learning Resources

1. **Start Here**: Run `apicli --help` to see all commands
2. **Examples**: Check `examples/` directory for sample collections
3. **Documentation**: Read `README.md` for complete docs
4. **Quick Start**: Follow `QUICKSTART.md` for hands-on tutorial

## 🤝 Support

For issues or questions:
1. Check `EXAMPLES.md` for usage patterns
2. Review `CLI-SUMMARY.md` for feature reference
3. Read troubleshooting section above

## ✨ Features Included

✅ GET, POST, PUT, DELETE, PATCH requests
✅ JSON and YAML collection support
✅ Environment variables (.env, JSON)
✅ Test assertions (status, content, headers, JSON path)
✅ HTML report generation
✅ Interactive CLI mode
✅ Colorized terminal output
✅ Response time tracking
✅ Error handling and validation

---

**You're all set!** Start testing your APIs with:

```bash
apicli test examples/test-collection.json
```

Enjoy! 🚀

