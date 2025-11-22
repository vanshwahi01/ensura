import { ethers } from "ethers";
import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("🚀 Starting deployment of InsuranceContract...");
  
  // Get network config
  const networkConfig = hre.config.networks.coston2;
  
  if (!networkConfig || networkConfig.type !== "http") {
    throw new Error("Network not configured");
  }
  
  // Create provider
  const rpcUrl = process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Create wallet
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("No PRIVATE_KEY configured. Please set PRIVATE_KEY in .env file");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("Deploying with account:", wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "C2FLR");
  
  if (balance === 0n) {
    throw new Error("Account has no balance. Please get testnet tokens from the faucet.");
  }
  
  // Get network info
  const network = await provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  
  // Load contract artifacts
  const artifactPath = "./artifacts/contracts/InsuranceContract.sol/InsuranceContract.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Deploy InsuranceContract
  console.log("\n📋 Deploying InsuranceContract...");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ InsuranceContract deployed to:", contractAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: "coston2",
    chainId: network.chainId.toString(),
    contract: "InsuranceContract",
    address: contractAddress,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    blockNumber: await provider.getBlockNumber()
  };
  
  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Save to file
  const deploymentFile = `deployment-${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentFile);
  
  // Explorer link
  console.log("\n🔍 View on Coston2 Explorer:");
  console.log(`https://coston2-explorer.flare.network/address/${contractAddress}`);
  
  console.log("\n✨ Deployment completed successfully!");
  console.log("\n💡 To interact with the contract, update CONTRACT_ADDRESS in scripts/interact.ts to:");
  console.log(contractAddress);
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

