import { execSync } from "child_process";

const HARDHAT_RPC_URL = "http://localhost:8545";

async function isHardhatNodeRunning() {
  try {
    // Try to make a simple RPC call to check if the node is running
    const response = await fetch(HARDHAT_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        console.log("✅ Hardhat node is running");
        process.exit(0);
      }
    }

    console.log("❌ Hardhat node is not running");
    console.log("💡 Start it with: npx hardhat node");
    process.exit(1);
  } catch (error) {
    console.log("❌ Hardhat node is not running");
    console.log("💡 Start it with: npx hardhat node");
    process.exit(1);
  }
}

isHardhatNodeRunning();
