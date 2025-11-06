# FHEVM Integration Files

This folder should contain the FHEVM integration files copied from the template.

## Required Files

Copy the following from `fhevm-hardhat-template旧/frontend/fhevm/`:

- `useFhevm.tsx`
- `FhevmDecryptionSignature.ts`
- `fhevmTypes.ts`
- `internal/` directory (entire folder)

## Copy Command

From the `demo17` directory:

```powershell
Copy-Item -Path "fhevm-hardhat-template旧\frontend\fhevm" -Destination "pro17\frontend\fhevm" -Recurse
```

Or manually copy using Windows File Explorer.

