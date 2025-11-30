# Contributing to Reqbeam

Thank you for your interest in contributing to Reqbeam! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check if the issue has already been reported:

1. Search existing [GitHub Issues](https://github.com/yourusername/reqbeam/issues)
2. If the issue exists, add your information as a comment
3. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, etc.)
   - Screenshots if applicable

### Suggesting Features

We welcome feature suggestions! To propose a feature:

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach (if you have ideas)

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/reqbeam.git
   cd reqbeam
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write or update tests if applicable
   - Update documentation as needed
   - Ensure your code passes linting

4. **Test your changes**
   ```bash
   npm run lint
   npm run build
   npm run dev  # Test locally
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```
   
   Use clear, descriptive commit messages:
   - Start with a verb (Add, Fix, Update, Remove)
   - Be specific about what changed
   - Reference issue numbers if applicable

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Wait for review and address feedback

## Development Setup

### Prerequisites

- Node.js v18.0 or higher
- npm, yarn, or pnpm
- PostgreSQL (for production) or SQLite (for development)
- Git

### Setup Steps

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/reqbeam.git
   cd reqbeam
   npm install
   ```

2. **Set up environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Project Structure

```
reqbeam/
├── reqbeam-db/          # Shared database package
├── reqbeam-cli/         # CLI tool
├── auth-server/         # Authentication server
├── src/                 # Next.js web application
│   ├── app/            # Next.js app router
│   ├── components/     # React components
│   ├── lib/            # Utilities and services
│   └── store/          # State management
└── docs/               # Documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper type definitions
- Follow existing code patterns and conventions

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose

### Formatting

- Run `npm run lint` before committing
- Use Prettier for code formatting (configured in project)
- Ensure consistent indentation (2 spaces)

### Testing

- Write tests for new features when applicable
- Ensure existing tests pass
- Test your changes thoroughly before submitting

## Documentation

- Update README.md if adding new features
- Update relevant documentation in `docs/` folder
- Add JSDoc comments for public APIs
- Keep code comments clear and concise

## Commit Message Guidelines

Use clear, descriptive commit messages:

```
Add: Feature description
Fix: Bug description
Update: What was updated
Remove: What was removed
Refactor: What was refactored
Docs: Documentation changes
```

Examples:
- `Add: Support for GraphQL requests`
- `Fix: Environment variable substitution in CLI`
- `Update: Dependencies to latest versions`
- `Docs: Add installation guide for Windows`

## Review Process

1. All pull requests require review
2. Address feedback promptly
3. Be open to suggestions and improvements
4. Maintain a respectful and professional tone

## Questions?

- Open an issue for questions
- Check existing documentation
- Ask in GitHub Discussions

## Recognition

Contributors will be recognized in:
- Project README
- Release notes
- GitHub contributors page

Thank you for contributing to Reqbeam!

