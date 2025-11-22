
const { ethers } = require("ethers");
const dotenv = require("dotenv");
// Try importing from the commonjs path directly if possible, or rely on node resolution
const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");

dotenv.config({ path: ".env.local" });

async function main() {
  console.log("Testing Broker Connection...");
  
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in .env.local");
  }

  const rpcUrl = process.env.OG_NETWORK_RPC || "https://evmrpc-testnet.0g.ai";
  console.log("Using RPC URL:", rpcUrl);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test basic network connection
    console.log("Fetching network info...");
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "Chain ID:", network.chainId.toString());

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("Wallet address:", wallet.address);
    
    const balance = await provider.getBalance(wallet.address);
    console.log("Wallet balance:", ethers.formatEther(balance), "OG");

    console.log("Creating Broker...");
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log("Broker created.");

    console.log("Listing available services...");
    const services = await broker.inference.listService();
    console.log(`Found ${services.length} services.`);
    
    for (const service of services) {
        console.log(`Provider: ${service.provider}, Model: ${service.model}, URL: ${service.url}`);
    }

  } catch (error) {
    console.error("Error:", error);
    if (error.cause) {
        console.error("Cause:", error.cause);
    }
  }
}

main().catch(console.error);

