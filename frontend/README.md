# Encrypted Exam Score Frontend

Next.js frontend application for the Encrypted Exam Score Log system.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Copy FHEVM files**

   You need to copy the `fhevm` folder from the template. See `COPY_FHEVM_FILES.md` in the root directory.

3. **Generate ABI files**

   After deploying the contract, generate the ABI files:

   ```bash
   npm run genabi
   ```

4. **Configure Rainbow Wallet**

   Update `app/providers.tsx` with your WalletConnect project ID from https://cloud.walletconnect.com

5. **Run development server**

   ```bash
   npm run dev
   ```

## Features

- **Rainbow Wallet Integration**: Connect using Rainbow wallet browser extension
- **Score Submission**: Submit exam scores in encrypted form
- **Score Viewing**: View encrypted scores from the blockchain
- **Score Decryption**: Decrypt and view your actual scores locally
- **Privacy-Preserving**: All scores are encrypted using FHE

## Project Structure

```
frontend/
├── app/              # Next.js app directory
│   ├── layout.tsx    # Root layout with Rainbow wallet
│   ├── page.tsx      # Main page
│   └── globals.css   # Global styles
├── components/       # React components
│   ├── ExamScoreDemo.tsx  # Main exam score component
│   └── ErrorNotDeployed.tsx
├── hooks/            # Custom React hooks
│   ├── useRainbowWallet.tsx  # Rainbow wallet integration
│   ├── useEncryptedExamScore.tsx  # Exam score logic
│   └── useInMemoryStorage.tsx
├── fhevm/            # FHEVM integration (copy from template)
├── abi/              # Generated ABI files
└── scripts/          # Build scripts
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run genabi` - Generate ABI files from deployments

