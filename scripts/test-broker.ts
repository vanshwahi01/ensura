
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import * as dotenv from "dotenv";

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

    const providerAddress = "0xf07240Efa67755B5311bc75784a061eDB47165Dd";
    console.log(`Acknowledging provider ${providerAddress}...`);
    
    await broker.inference.acknowledgeProviderSigner(providerAddress);
    console.log("Provider acknowledged.");

  } catch (error: any) {
    console.error("Error:", error);
    if (error.cause) {
        console.error("Cause:", error.cause);
    }
  }
}

main().catch(console.error);

