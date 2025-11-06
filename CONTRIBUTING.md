# Contributing to Encrypted Exam Score Log

Thank you for your interest in contributing to the Encrypted Exam Score Log project! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Git
- Rainbow Wallet browser extension (for frontend testing)

### Installation

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/encrypted-exam-score.git
   cd encrypted-exam-score
   ```

2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up Hardhat variables:
   ```bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   ```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 3. Testing

```bash
# Run all tests
npm test

# Run tests on Sepolia
npm run test:sepolia

# Generate coverage report
npm run coverage

# Run linting
npm run lint
```

### 4. Commit Changes

Follow conventional commit format:

```bash
git commit -m "feat: add new encryption feature"
git commit -m "fix: resolve decryption bug"
git commit -m "docs: update API documentation"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Create a pull request with a clear description of the changes.

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Use meaningful variable and function names

### Solidity

- Follow Solidity style guide
- Use NatSpec documentation for all public functions
- Write comprehensive tests
- Follow security best practices

### Commit Messages

Use conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/modifications
- `chore:` - Maintenance tasks

## Testing

### Unit Tests

- Write unit tests for all smart contract functions
- Test edge cases and error conditions
- Achieve good test coverage (>90%)

### Integration Tests

- Test frontend-backend interaction
- Test wallet integration
- Test deployment scripts

## Security Considerations

- Never commit private keys or sensitive data
- Follow FHEVM security best practices
- Review code for potential vulnerabilities
- Use established cryptographic libraries

## Documentation

- Update README.md for new features
- Document API changes
- Provide examples for complex functionality
- Keep documentation current

## Questions?

If you have questions about contributing, please:

1. Check existing issues and documentation
2. Create an issue for discussion
3. Reach out to maintainers

Thank you for contributing to privacy-preserving education technology! 🔒📚
