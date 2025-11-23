import { network } from "hardhat";

/**
 * Deploy the InsuranceDemoContract to Coston2
 * This is a simplified version without FDC verification for easy demos
 */
async function main() {
  console.log("🚀 Deploying InsuranceDemoContract to Coston2...\n");

  // Connect to network (Hardhat 3 + ES modules)
  const { ethers } = await network.connect();

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "C2FLR\n");

  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  WARNING: Low balance. Get testnet tokens from:");
    console.log("   https://faucet.flare.network/coston2\n");
  }

  // Deploy contract
  console.log("⏳ Deploying contract...");
  const InsuranceDemoContract = await ethers.getContractFactory("InsuranceDemoContract");
  const contract = await InsuranceDemoContract.deploy();
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n✅ Contract deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("🔗 View on explorer:");
  console.log(`   https://coston2-explorer.flare.network/address/${address}\n`);

  // Save deployment info
  const deploymentInfo = {
    network: "coston2",
    contractName: "InsuranceDemoContract",
    address: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("📦 Deployment details:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 Next steps:");
  console.log("   1. Verify contract (optional):");
  console.log(`      npx hardhat verify --network coston2 ${address}`);
  console.log("   2. Seed demo offers:");
  console.log("      npx hardhat run scripts/seed-demo-offers.ts --network coston2");
  console.log("\n");

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

