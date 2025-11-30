# Reqbeam - Open Source API Testing Tool

A modern, full-featured API testing and development platform built with **Next.js 15**, **TypeScript**, **Prisma**, and **Tailwind CSS**. Reqbeam provides a beautiful web interface and powerful CLI for testing, organizing, and managing your APIs.

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Setup Guide](#-setup-guide)
- [Usage Examples](#-usage-examples)
- [Use Cases](#-use-cases)
- [Architecture](#-architecture)
- [CLI Tool](#-cli-tool)
- [Docker Deployment](#-docker-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## Features

### Core Features

- **HTTP Request Builder** - Full support for GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Query Parameters Management** - Add, edit, enable/disable params with automatic URL sync
- **Headers Management** - Custom headers with key-value pairs
- **Request Body** - Support for JSON, form-data, and x-www-form-urlencoded
- **Authorization System** - Multiple auth types: No Auth, API Key, Bearer Token, Basic Auth, OAuth 2.0 (PKCE)
- **Response Viewer** - Beautiful syntax-highlighted JSON responses with formatting
- **Request History** - Track all your API requests with timestamps and response data
- **Collections** - Organize requests into collections for better management
- **Environments** - Manage multiple environments (dev, staging, prod) with variables
- **Workspaces** - Multi-workspace support for team collaboration
- **Tab Management** - Work on multiple requests simultaneously
- **Mock Servers** - Create mock endpoints for testing and development
- **Import/Export** - Import from OpenAPI/Swagger, export collections

### Authentication & Security

- **User Registration & Login** - Secure authentication with NextAuth.js
- **Google OAuth** - Sign in with Google (PKCE flow)
- **Session Management** - Persistent user sessions
- **Protected Routes** - Secure API endpoints
- **JWT Tokens** - Secure token-based authentication for CLI

### CLI Features

- **Command-Line Interface** - Full-featured CLI tool for automation
- **Cloud Sync** - Real-time synchronization with web UI
- **Collection Execution** - Run entire collections from terminal
- **Test Automation** - Automated testing with scheduling
- **Logging & Monitoring** - Comprehensive execution logs
- **History Replay** - Replay past executions

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Syntax Highlighting:** [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)

---

## Installation

### Prerequisites

- **Node.js** v18.0+ ([Download](https://nodejs.org/))
- **npm**, **yarn**, or **pnpm**
- **PostgreSQL** v14+ (production) or **SQLite** (development)
- **Git** ([Download](https://git-scm.com/))

### Quick Install

```bash
# Clone and install
git clone https://github.com/reqbeam/reqbeam.git
cd reqbeam
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Set up database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Alternative: Docker

```bash
git clone https://github.com/reqbeam/reqbeam.git
cd reqbeam
docker-compose up -d
```

### Automated Setup

```bash
chmod +x setup.sh
./setup.sh
# or
npm run setup:all
```

For detailed installation instructions, see the [Installation Guide](https://reqbeam.github.io/reqbeam/installation).

---

## Quick Start

1. **Install** - Follow the [Installation](#-installation) steps above
2. **Configure** - Set up your `.env` file (see [env.example](./env.example))
3. **Start** - Run `npm run dev` and open http://localhost:3000
4. **Sign Up** - Create an account and start testing APIs

For step-by-step instructions, see the [Quick Start Guide](https://reqbeam.github.io/reqbeam/quick-start).

---

## Usage Examples

### Web Interface

1. Sign up and create a workspace
2. Click "New Request" and enter your API URL
3. Add headers, query parameters, or request body as needed
4. Click "Send" to execute the request
5. Save requests to collections for organization

See the [Web Interface Documentation](https://reqbeam.github.io/reqbeam/web-interface) for detailed guides.

### CLI Usage

```bash
# Authenticate and set up
rb auth login
rb workspace create my-project
rb env add development -i

# Create and run requests
rb request create -n "Get Users" -m GET -u "{{API_URL}}/users"
rb run request "Get Users"

# Manage collections
rb collection create "User API"
rb collection add "User API" "Get Users"
rb run collection "User API" --parallel
```

See the [CLI Documentation](https://reqbeam.github.io/reqbeam/cli) for more examples.

---

## Use Cases

### 1. API Development & Testing

- **Test REST APIs** during development
- **Debug API endpoints** with detailed request/response inspection
- **Validate API responses** with syntax highlighting
- **Test different environments** (dev, staging, production)

### 2. API Documentation

- **Organize requests** into collections by feature or endpoint
- **Share collections** with team members
- **Export collections** to JSON/YAML for documentation
- **Import from OpenAPI/Swagger** specifications

### 3. CI/CD Integration

- **Automate API testing** with CLI in CI pipelines
- **Run collections** as part of deployment process
- **Schedule automated tests** with cron jobs
- **Export test results** for reporting

### 4. Team Collaboration

- **Share workspaces** with team members
- **Sync collections** across devices
- **Track request history** for debugging
- **Manage environments** per team member

### 5. Mock Server Development

- **Create mock endpoints** for frontend development
- **Test API integrations** without backend dependencies
- **Simulate different response scenarios**

### 6. API Monitoring

- **Schedule periodic tests** to monitor API health
- **Track response times** and status codes
- **Export logs** for analysis
- **Set up automated alerts** for failures

---

## Architecture

### Project Structure

```
reqbeam/
├── reqbeam-db/          # Shared database package
│   ├── prisma/         # Prisma schema and migrations
│   └── src/            # Database services
├── reqbeam-cli/        # CLI tool
│   ├── src/            # CLI source code
│   └── bin/            # CLI executables
├── auth-server/        # Optional authentication server
│   └── src/            # Auth server code
├── src/                # Next.js web application
│   ├── app/            # Next.js app router
│   ├── components/     # React components
│   ├── lib/            # Utilities and services
│   └── store/          # State management
├── prisma/             # Database files (SQLite)
├── public/             # Static assets
└── docker-compose.yml  # Docker configuration
```

### Database Architecture

- **PostgreSQL** (production) or **SQLite** (development)
- **Prisma ORM** for type-safe database access
- **Shared database package** (`@reqbeam/db`) for CLI and web app
- **Workspace-based** data isolation

### Authentication Flow

1. **Web UI**: NextAuth.js with email/password and Google OAuth
2. **CLI**: JWT token-based authentication
3. **Auth Server**: Optional separate authentication service

---

## CLI Tool

Reqbeam includes a powerful CLI tool for automation and CI/CD integration.

### Installation

```bash
cd reqbeam-cli
npm install && npm run build
npm link  # Install globally
rb auth login
```

### Quick Example

```bash
# Create workspace and environment
rb workspace create my-project
rb env add development -i

# Create and run request
rb request create -n "Get Users" -m GET -u "{{API_URL}}/users"
rb run request "Get Users"
```

For complete CLI documentation, see [CLI Documentation](https://reqbeam.github.io/reqbeam/cli) or [reqbeam-cli/README.md](./reqbeam-cli/README.md).

---

## Docker Deployment

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

For detailed Docker setup, see [DOCKER.md](./DOCKER.md).

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:3000` |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint for code quality checks |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio (Database GUI) |
| `npm run setup` | Run setup script |
| `npm run setup:all` | Complete setup (db, web, cli) |

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo service postgresql status  # Linux
brew services list              # Mac

# Restart PostgreSQL
sudo service postgresql restart  # Linux
brew services restart postgresql # Mac
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npm run db:generate

# Reset database (WARNING: This will delete all data)
cd reqbeam-db
npx prisma migrate reset
```

### Port Already in Use

```bash
# On Linux/Mac
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### CLI Authentication Issues

```bash
# Re-authenticate
rb auth login

# Check authentication status
cat ~/.reqbeam/auth.json
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- How to report bugs
- How to suggest features
- Development setup
- Coding standards
- Pull request process

By contributing, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Inspired by [Hoppscotch](https://hoppscotch.io/), [Insomnia](https://insomnia.rest/), and [Postman](https://www.postman.com/)
- Built with amazing open-source tools and libraries
- Thanks to all contributors and the open-source community

---

## Support

### Getting Help

- **Documentation**: Visit the [official documentation site](https://reqbeam.github.io/reqbeam/) or check the [docs](./docs/) folder
- **Issues**: Open an issue on [GitHub Issues](https://github.com/reqbeam/reqbeam/issues)
- **Discussions**: Join discussions on [GitHub Discussions](https://github.com/reqbeam/reqbeam/discussions)
- **Security**: Report security vulnerabilities to [SECURITY.md](SECURITY.md)

### Useful Links

- [Documentation Site](https://reqbeam.github.io/reqbeam/) - Complete documentation on GitHub Pages
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines
- [Security Policy](SECURITY.md) - Security reporting
- [CLI Documentation](./reqbeam-cli/README.md)
- [Database Setup Guide](./reqbeam-db/README.md)
- [Auth Server Setup](./auth-server/README.md)
- [Docker Guide](./DOCKER.md)

---

## Show Your Support

If you like this project, please give it a ⭐️ on GitHub!

---

**Happy API Testing! 🚀**
