import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "EncryptedExamScore";

// <root>/pro17
const rel = "..";

// <root>/pro17/frontend/abi
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/pro17${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function deployOnHardhatNode() {
  // Skip deployment in CI/CD environments (like Vercel)
  if (process.env.CI || process.env.VERCEL || process.env.VERCEL_ENV) {
    return false;
  }
  if (process.platform === "win32") {
    // Not supported on Windows
    return false;
  }
  const deployScriptPath = path.join(path.resolve("./scripts"), "deploy-hardhat-node.sh");
  if (!fs.existsSync(deployScriptPath)) {
    // Script doesn't exist, skip deployment
    return false;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
    return true;
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    return false;
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    // Skip if in CI/CD environment or script doesn't exist
    const deployed = deployOnHardhatNode();
    if (!deployed && !optional) {
      // If deployment failed and it's not optional, check for existing ABI files
      const existingABIPath = path.join(outdir, `${CONTRACT_NAME}ABI.ts`);
      if (fs.existsSync(existingABIPath)) {
        console.log(`${line}Deployment failed, but existing ABI files found. Using existing files.${line}`);
        return undefined; // Will be handled by the fallback logic below
      }
    }
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    console.error(
      `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
    );
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(
    path.join(chainDeploymentDir, `${contractName}.json`),
    "utf-8"
  );

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

// Auto deployed on Linux/Mac (will fail on windows)
// In Vercel build, deployments might not exist, so make it optional
const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, true /* optional for Vercel */);

// Sepolia is optional
let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);

// If deployments don't exist (e.g., in Vercel build), try to use existing ABI files
if (!deployLocalhost || !deploySepolia) {
  const existingABIPath = path.join(outdir, `${CONTRACT_NAME}ABI.ts`);
  const existingAddressesPath = path.join(outdir, `${CONTRACT_NAME}Addresses.ts`);
  
  if (fs.existsSync(existingABIPath) && fs.existsSync(existingAddressesPath)) {
    console.log(`${line}Deployment files not found, but existing ABI files found. Skipping generation.${line}`);
    process.exit(0);
  } else {
    // In CI/CD environments, this is acceptable if ABI files are committed
    if (process.env.CI || process.env.VERCEL || process.env.VERCEL_ENV) {
      console.warn(
        `${line}Warning: Deployment files not found in CI/CD environment.${line}` +
        `${line}Please ensure frontend/abi/ directory is committed to the repository.${line}`
      );
      // Don't fail the build, let it continue - ABI files should be committed
      if (fs.existsSync(existingABIPath)) {
        console.log(`${line}Found existing ABI file, continuing build...${line}`);
        process.exit(0);
      }
    }
    console.error(
      `${line}Deployment files not found and no existing ABI files. Please ensure deployments directory exists or ABI files are committed.${line}`
    );
    process.exit(1);
  }
}

if (!deploySepolia) {
  deploySepolia= { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
}

if (deployLocalhost && deploySepolia) {
  if (
    JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
  ) {
    console.error(
      `${line}Deployments on localhost and Sepolia differ. Cant use the same abi on both networks. Consider re-deploying the contracts on both networks.${line}`
    );
    process.exit(1);
  }
}


const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
\n`;
const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

