# Encrypted Exam Score Log

A privacy-preserving system for tracking exam scores using Fully Homomorphic Encryption (FHE) on the FHEVM protocol by Zama.

## Overview

This system allows users to:
- Submit exam scores in encrypted form
- View their encrypted scores
- Decrypt and view their actual scores locally
- Keep scores private from platform analysis and advertising

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager
- **Rainbow Wallet**: Browser extension installed

### Installation

1. **Install dependencies**

   ```bash
   npm install
   cd frontend
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Run frontend**

   ```bash
   cd frontend
   npm run dev
   ```

## 📁 Project Structure

```
encrypted-exam-score/
├── contracts/              # Smart contract source files
│   └── EncryptedExamScore.sol
├── deploy/                 # Deployment scripts
├── tasks/                  # Hardhat custom tasks
├── test/                   # Test files
├── frontend/               # Next.js frontend application
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   └── fhevm/             # FHEVM integration
├── hardhat.config.ts      # Hardhat configuration
└── package.json           # Dependencies and scripts
```

## 📜 Available Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run test:sepolia` | Run tests on Sepolia |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

## 🔐 Features

- **Privacy-Preserving**: Scores are encrypted using FHE, so the platform cannot see actual values
- **User Control**: Only users can decrypt their own scores
- **No Data Analysis**: Platform cannot analyze scores for recommendations or advertising
- **Secure Storage**: Scores stored on-chain in encrypted form

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [Rainbow Wallet](https://rainbow.me/)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License.

---

**Built with ❤️ using Zama FHEVM**

