# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Reqbeam seriously. If you discover a security vulnerability, please follow these steps:

### Do Not

- Open a public GitHub issue
- Discuss the vulnerability publicly
- Share the vulnerability with others until it's been addressed

### Do

1. **Report via GitHub Security Advisories** (preferred):
   - Go to [GitHub Security Advisories](https://github.com/reqbeam/reqbeam/security/advisories)
   - Click "Report a vulnerability"
   - Fill out the security advisory form
   - Include a detailed description of the vulnerability
   - Provide steps to reproduce the issue
   - Include any potential impact assessment

2. **Wait for our response**
   - We will acknowledge receipt within 48 hours
   - We will provide an estimated timeline for a fix
   - We will keep you informed of our progress

3. **Allow time for a fix**
   - We will work to address the vulnerability promptly
   - We may ask for additional information or clarification
   - We will coordinate disclosure after a fix is available

### What to Include

When reporting a security vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: Potential impact and severity assessment
- **Suggested Fix**: If you have ideas for fixing the issue
- **Environment**: Your environment details (OS, Node.js version, etc.)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity, typically 30-90 days
- **Disclosure**: After fix is released and deployed

### Severity Levels

We use the following severity levels:

- **Critical**: Immediate threat, requires urgent attention
- **High**: Significant security risk, should be addressed quickly
- **Medium**: Moderate security risk, should be addressed in reasonable time
- **Low**: Minor security issue, can be addressed in normal release cycle

### Recognition

We appreciate responsible disclosure. With your permission, we will:

- Credit you in our security advisories
- Add you to our security acknowledgments
- Thank you publicly (if you wish)

### Security Best Practices

When using Reqbeam:

1. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Use strong secrets**
   - Generate strong `NEXTAUTH_SECRET` values
   - Use secure database passwords
   - Rotate credentials regularly

3. **Secure your environment**
   - Don't commit `.env` files
   - Use environment variables for sensitive data
   - Restrict database access

4. **Follow authentication best practices**
   - Use strong passwords
   - Enable OAuth when possible
   - Keep authentication tokens secure

5. **Regular updates**
   - Keep Reqbeam updated to the latest version
   - Monitor security advisories
   - Review release notes for security fixes

### Known Security Considerations

- **Database Security**: Ensure your database is properly secured and not publicly accessible
- **Authentication**: Use strong secrets and keep them secure
- **API Keys**: Never commit API keys or secrets to version control
- **CORS**: Configure CORS properly for production deployments
- **HTTPS**: Always use HTTPS in production environments

### Security Updates

Security updates will be:

- Released as patch versions (e.g., 1.0.0 → 1.0.1)
- Documented in release notes
- Communicated through GitHub security advisories
- Prioritized in our development workflow

### Contact

For security-related questions or concerns:

- **Security Email**: Please use GitHub Security Advisories (see below) or create a private security issue
- **GitHub Security Advisories**: [GitHub Security](https://github.com/reqbeam/reqbeam/security/advisories)

Thank you for helping keep Reqbeam secure!

