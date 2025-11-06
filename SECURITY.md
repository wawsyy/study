# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in the Encrypted Exam Score Log project, please help us by reporting it responsibly.

### How to Report

Please **DO NOT** create public GitHub issues for security vulnerabilities.

Instead, please report security vulnerabilities by emailing [security@example.com](mailto:security@example.com) with the following information:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity
- Any suggested fixes or mitigations
- Your contact information for follow-up

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Investigation**: We will investigate the issue and provide regular updates
- **Resolution**: We will work to resolve the issue and notify you when it's fixed
- **Disclosure**: We will coordinate disclosure with you to ensure responsible disclosure

### Scope

This security policy applies to:

- The EncryptedExamScore smart contract
- The Next.js frontend application
- Associated deployment and configuration scripts
- Official documentation

### Out of Scope

This policy does not cover:

- Third-party dependencies (please report to respective maintainers)
- Browser wallet extensions
- Operating system vulnerabilities
- Network infrastructure issues

## Security Best Practices

### For Smart Contracts

- All contracts use Fully Homomorphic Encryption (FHE) to protect user data privacy
- Emergency pause functionality allows quick response to incidents
- Time-locked operations prevent rushed decisions
- Comprehensive audit logging for transparency
- Access control mechanisms for administrative functions

### For Frontend

- Secure wallet integration with Rainbow Wallet
- Input validation and sanitization
- No sensitive data stored in local storage
- HTTPS-only communication
- Regular dependency updates

### For Development

- Comprehensive test coverage
- Code linting and static analysis
- Security-focused code reviews
- Dependency vulnerability scanning
- Regular security audits

## Responsible Disclosure

We kindly ask that you:

- Give us reasonable time to fix the issue before public disclosure
- Avoid accessing or modifying user data
- Avoid disrupting service availability
- Avoid spamming our systems

## Recognition

We appreciate security researchers who help keep our users safe. With your permission, we will acknowledge your contribution in our security advisory.

## Contact

For security-related questions or concerns, please contact us at [security@example.com](mailto:security@example.com).
