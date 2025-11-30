# Reqbeam v1.0.0 - Release Notes

**Release Date:** [Date]  
**Version:** 1.0.0  
**License:** MIT

---

## Overview

This document describes the first public release of Reqbeam, an open-source API testing and development platform. Reqbeam provides a comprehensive web interface and command-line tool for testing, organizing, and managing APIs.

---

## Table of Contents

- [What's New](#whats-new)
- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [What's Included](#whats-included)
- [Breaking Changes](#breaking-changes)
- [Known Issues](#known-issues)
- [Migration Guide](#migration-guide)
- [Documentation](#documentation)
- [Technical Specifications](#technical-specifications)
- [Contributing](#contributing)
- [Support](#support)

---

## What's New

This is the first public release of Reqbeam. This release includes:

### Complete API Testing Platform

- Full-featured web interface built with Next.js 15
- Command-line interface tool for automation and CI/CD integration
- Real-time synchronization between CLI and web interface
- Multi-workspace support for project organization and team collaboration
- Comprehensive authentication system with email/password and Google OAuth support

### Production-Ready Features

- Database support for PostgreSQL (production) and SQLite (development)
- Docker containerization with Docker Compose configuration
- TypeScript codebase with full type safety
- Prisma ORM for type-safe database access
- Modular architecture with shared database package

---

## Key Features

### Web Interface

#### HTTP Request Builder

- Support for all HTTP methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- Query parameters management with enable/disable functionality
- Custom headers with key-value pair management
- Multiple request body types: JSON, form-data, x-www-form-urlencoded
- URL encoding and decoding
- Automatic URL synchronization with query parameters

#### Authorization

- No authentication option
- API Key authentication (header or query parameter)
- Bearer Token authentication
- Basic Authentication
- OAuth 2.0 with PKCE flow
- Google OAuth integration

#### Response Handling

- Syntax-highlighted JSON response display
- Response formatting and pretty-print functionality
- HTTP status code indicators
- Response time tracking and display
- Response size calculation
- Copy response to clipboard functionality

#### Organization and Management

- **Collections**: Organize API requests into collections
- **Environments**: Manage multiple environments (development, staging, production)
- **Environment Variables**: Variable substitution using `{{VARIABLE}}` syntax
- **Workspaces**: Multi-workspace support for team collaboration
- **Request History**: Track all API requests with timestamps and metadata
- **Tab Management**: Work on multiple requests simultaneously
- **Import/Export**: Import from OpenAPI/Swagger specifications, export collections

#### Mock Servers

- Create mock endpoints for testing and development
- Custom response configuration
- Support for multiple response scenarios

#### User Experience

- Dark theme with modern design
- Responsive design for mobile, tablet, and desktop devices
- Color-coded HTTP methods for visual distinction
- Keyboard shortcuts for power users
- Smooth animations and transitions
- Real-time status updates

### Command-Line Interface

#### Workspace Management

- Create, list, switch, and delete workspaces
- Workspace activation and persistence
- Cloud-based workspace storage with database synchronization

#### Environment Management

- Create and manage environments per workspace
- Interactive environment variable input
- Environment switching functionality
- Variable substitution with `{{VARIABLE}}` syntax in requests

#### Request Management

- Create requests with full HTTP method support
- Interactive request creation mode
- Update and delete existing requests
- List all requests within a workspace
- Support for headers, request body, and descriptions

#### Collection Management

- Create collections
- Add and remove requests from collections
- List all collections
- Export collections to JSON or YAML format
- Import collections from files

#### Execution and Testing

- Execute individual requests
- Execute entire collections
- Parallel execution support for collections
- Environment-specific execution
- Response saving functionality
- Execution history tracking
- History replay functionality

#### Test Automation

- Custom test framework implementation
- Auto-generation of test skeleton files
- Cron-based test scheduling
- Test result reporting and analysis
- Scheduled job management (start, stop, delete)

#### Logging and Monitoring

- Comprehensive execution logging
- Detailed log viewing with full context
- Export logs to JSON or CSV format
- Log filtering and search capabilities
- Execution statistics and analytics
- Success rate tracking

#### CLI User Experience

- Colorized terminal output
- Progress indicators for long-running operations
- Formatted tables for data display
- Status code color coding
- Method-specific color schemes
- Comprehensive error handling with helpful messages

### Authentication and Security

- User registration with email and password
- Secure user login functionality
- Google OAuth integration with PKCE flow
- Persistent user session management
- JWT token-based authentication for CLI
- Protected API routes and endpoints
- Strong password validation requirements

---

## Installation

### Prerequisites

- Node.js version 18.0 or higher ([Download](https://nodejs.org/))
- Package manager: npm, yarn, or pnpm
- PostgreSQL version 14 or higher (for production) or SQLite (for development)
- Git version control system ([Download](https://git-scm.com/))

### Installation Methods

#### Method 1: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/yourusername/reqbeam.git
cd reqbeam

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

#### Method 2: Using Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/reqbeam.git
cd reqbeam

# Start with Docker Compose
docker-compose up -d
```

#### Method 3: Automated Setup Script

```bash
# Clone the repository
git clone https://github.com/yourusername/reqbeam.git
cd reqbeam

# Run automated setup
chmod +x setup.sh
./setup.sh
```

The automated setup script performs the following:
- Sets up the database package (reqbeam-db)
- Installs web application dependencies
- Sets up and builds the CLI tool
- Links CLI globally for system-wide access

### CLI Installation

```bash
cd reqbeam-cli
npm install
npm run build
npm link  # Install globally

# Authenticate
reqbeam auth login
# or use alias
rb auth login
```

---

## Quick Start

### 1. Environment Configuration

```bash
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/reqbeam?schema=public"
# Or for SQLite: DATABASE_URL="file:./prisma/dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App Configuration
NEXT_PUBLIC_APP_NAME="Reqbeam"
```

**Generate NEXTAUTH_SECRET:**

```bash
# Linux/Mac
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Database Setup

**PostgreSQL:**
```bash
psql -U postgres
CREATE DATABASE reqbeam;
\q

npm run db:generate
npm run db:push
```

**SQLite:**
```bash
npm run db:generate
npm run db:push
```

### 3. Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Create Your First Request

1. Sign up for a new account
2. Create a workspace
3. Click "New Request" button
4. Enter API URL and send the request
5. Save the request to a collection

---

## What's Included

### Core Packages

- **reqbeam**: Main Next.js web application
- **reqbeam-cli**: Command-line interface tool
- **reqbeam-db**: Shared database package with Prisma ORM
- **auth-server**: Optional separate authentication server

### Documentation

- **README.md**: Comprehensive project documentation
- **CLI Documentation**: Complete CLI guide (reqbeam-cli/README.md)
- **Database Documentation**: Database setup guide (reqbeam-db/README.md)
- **Auth Server Documentation**: Authentication server setup (auth-server/README.md)
- **Docker Guide**: Docker deployment instructions (DOCKER.md)
- **Additional Guides**: Various documentation files in docs/ folder

### Configuration Files

- **env.example**: Environment variables template
- **docker-compose.yml**: Docker Compose configuration
- **Dockerfile**: Docker image definition
- **setup.sh**: Automated setup script
- **TypeScript configurations**: TypeScript configuration for all packages
- **Prisma schemas**: Database schema definitions

---

## Breaking Changes

This is the first release, so there are no breaking changes from previous versions. However, please note the following:

### Database Schema

- The database schema is finalized in this release
- Future releases will provide migration scripts for schema updates
- Always backup your database before upgrading to new versions

### CLI Commands

- The `reqbeam init` command is deprecated in favor of `reqbeam workspace create`
- The `reqbeam project` commands are deprecated but remain functional for backward compatibility
- New projects should use `reqbeam workspace` commands

### Environment Variables

- All required environment variables are documented in env.example
- Missing required environment variables will cause the application to fail at startup
- Refer to the README for complete environment variable documentation

---

## Known Issues

### General Issues

1. **First-time Setup**
   - Database migrations may take several seconds on first run
   - If connection errors occur, ensure PostgreSQL service is running (when using PostgreSQL)

2. **CLI Authentication**
   - CLI requires the web application to be running for browser-based login
   - Use `--email` and `--password` flags for headless environments or CI/CD pipelines

3. **Docker Deployment**
   - Database volume must be properly mounted for data persistence
   - Ensure proper file permissions on database volume directory

### Platform-Specific Issues

1. **Windows**
   - Use Git Bash or WSL for running setup.sh script
   - PowerShell may have compatibility issues with some scripts

2. **Linux/Mac**
   - Ensure Node.js version 18 or higher is installed
   - PostgreSQL users must ensure PostgreSQL service is running

### Performance Considerations

1. **Large Collections**
   - Collections with 100+ requests may experience slower load times
   - Consider splitting large collections into smaller, focused collections

2. **Database Performance**
   - SQLite is suitable for development and testing only
   - Use PostgreSQL for production deployments to ensure optimal performance

---

## Migration Guide

### Migrating from Other API Testing Tools

If you are migrating from Postman, Insomnia, or Hoppscotch:

1. **Export Collections**
   - Export your collections from your current tool in JSON format
   - Reqbeam supports OpenAPI/Swagger import formats

2. **Import to Reqbeam**
   - Use the Import feature in the web interface
   - Alternatively, use CLI: `rb collection import <file>`

3. **Set Up Environments**
   - Recreate your environments in Reqbeam
   - Use the same variable names for compatibility with existing requests

4. **Migrate Authentication**
   - Reqbeam uses a different authentication system
   - You will need to recreate authentication configurations

### Migrating from Development to Production

1. **Database Migration**
   ```bash
   # Backup development database
   pg_dump reqbeam > backup.sql
   
   # Set up production database
   # Update DATABASE_URL in production .env file
   npm run db:migrate
   ```

2. **Environment Variables**
   - Update all environment variables for production environment
   - Generate a new NEXTAUTH_SECRET for production
   - Update NEXTAUTH_URL to your production domain

3. **Build and Deploy**
   ```bash
   npm run build
   npm run start
   ```

---

## Documentation

### Getting Started

- **README.md**: Main project documentation
- **Quick Start Guide**: Get up and running in 5 minutes (README.md#quick-start)

### CLI Documentation

- **CLI README**: Complete CLI documentation (reqbeam-cli/README.md)
- **CLI Quick Start**: CLI quick start guide (reqbeam-cli/QUICKSTART.md)
- **CLI Examples**: Real-world CLI usage examples (reqbeam-cli/EXAMPLES.md)
- **CLI Commands**: Detailed command documentation (docs/cli docs/)

### Advanced Topics

- **Workspace Feature**: Workspace management guide (docs/WORKSPACE_FEATURE.md)
- **Database Migration**: Database setup guide (docs/DATABASE_MIGRATION_COMPLETE.md)
- **Docker Guide**: Docker deployment guide (DOCKER.md)
- **Authorization Guide**: Authentication setup (docs/AUTHORIZATION.md)
- **Google OAuth Setup**: OAuth configuration (docs/GOOGLE_OAUTH_SETUP.md)

### API Documentation

- **Auth Server API**: Authentication server endpoints (auth-server/README.md)
- **Web API Routes**: Web application API routes (src/app/api/)

---

## Technical Specifications

### Frontend Technologies

- **Next.js 15**: React framework with App Router
- **TypeScript 5.3**: Type-safe JavaScript
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **React 18.2**: UI library
- **Zustand 4.4**: State management
- **Lucide React**: Icon library

### Backend Technologies

- **Next.js API Routes**: Serverless API endpoints
- **Prisma 5.22**: Next-generation ORM
- **PostgreSQL**: Production database
- **SQLite**: Development database
- **NextAuth.js 4.24**: Authentication library
- **bcryptjs**: Password hashing

### CLI Technologies

- **Commander.js 11.1**: CLI framework
- **Axios 1.6**: HTTP client
- **Chalk 5.3**: Terminal styling
- **Inquirer 9.2**: Interactive prompts
- **Ora 8.0**: Progress indicators

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Docker**: Containerization

### System Requirements

- **Node.js**: Version 18.0 or higher
- **npm/yarn/pnpm**: Latest stable version
- **PostgreSQL**: Version 14 or higher (production)
- **SQLite**: Included with Node.js (development)
- **Docker**: Version 20.10 or higher (optional)

---

## Contributing

We welcome contributions from the community. Here's how you can help:

### Ways to Contribute

1. **Report Bugs**: Open an issue with detailed information about the bug
2. **Suggest Features**: Share your ideas for improvements and new features
3. **Submit Pull Requests**: Fix bugs or add new features
4. **Improve Documentation**: Help make documentation better and more comprehensive
5. **Share Feedback**: Provide feedback on features and user experience

### Getting Started with Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the code style guidelines
4. Commit with clear messages (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request with a detailed description

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/reqbeam.git
cd reqbeam

# Install dependencies
npm install

# Set up development environment
cp env.example .env
# Edit .env with development settings

# Run development server
npm run dev
```

### Code Style Guidelines

- Follow existing code style and patterns
- Use TypeScript for all new code
- Write meaningful commit messages
- Add tests for new features when applicable
- Update documentation for new features

---

## Support

### Getting Help

- **Documentation**: Check the README.md and docs/ folder for comprehensive guides
- **Bug Reports**: Open an issue on GitHub Issues
- **Discussions**: Join GitHub Discussions for questions and community support
- **Email**: Contact support at [your-email] (if applicable)

### Community Resources

- Join community discussions
- Share your use cases and experiences
- Help other users with questions
- Contribute to the project

---

## Credits

### Inspiration

Reqbeam is inspired by the following open-source API testing tools:

- **Hoppscotch**: Beautiful API testing interface
- **Insomnia**: Powerful API client
- **Postman**: Industry-leading API platform

### Open Source Libraries

Built with the following open-source tools and libraries:

- **Next.js**: The React Framework
- **Prisma**: Next-generation ORM
- **Tailwind CSS**: Utility-first CSS framework
- **NextAuth.js**: Authentication for Next.js
- **Zustand**: State management
- And many other open-source libraries

### Contributors

Thank you to all contributors who have helped make Reqbeam possible.

---

## Statistics

- **Total Lines of Code**: 50,000+
- **TypeScript Files**: 100+
- **React Components**: 20+
- **API Routes**: 30+
- **CLI Commands**: 50+
- **Database Models**: 10+

---

## Roadmap

### Upcoming Features (v1.1.0)

- GraphQL support
- WebSocket testing capabilities
- gRPC support
- Advanced test assertions
- Enhanced team collaboration features
- API documentation generator
- Response validation
- Request/response diffing
- Performance testing capabilities
- API monitoring dashboard

### Future Considerations

- Mobile application
- Browser extension
- VS Code extension
- Plugin system
- API marketplace
- Cloud hosting option

---

## Changelog

### v1.0.0 (First Release)

#### Added

- Complete web interface with Next.js 15
- Full-featured CLI tool
- Workspace management system
- Collection management functionality
- Environment variable support
- Request history tracking
- Mock server functionality
- Import/Export capabilities
- Google OAuth integration
- Docker support and configuration
- Comprehensive documentation
- Test automation framework
- Logging and monitoring system
- Real-time CLI-Web synchronization

#### Fixed

- Initial release - no fixes from previous versions

#### Changed

- Initial release - no changes from previous versions

#### Deprecated

- `reqbeam init` command (use `reqbeam workspace create` instead)
- `reqbeam project` commands (use `reqbeam workspace` commands instead)

---

## Links

- **GitHub Repository**: [https://github.com/yourusername/reqbeam](https://github.com/yourusername/reqbeam)
- **Documentation**: [README.md](./README.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/reqbeam/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/reqbeam/discussions)
- **License**: [MIT License](./LICENSE)

---

## Thank You

Thank you for trying Reqbeam. We look forward to seeing what you build with it.

For questions, issues, or contributions, please visit our GitHub repository.

---

**Reqbeam Team**
