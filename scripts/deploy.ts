import hre from "hardhat";

async function main() {
  console.log("🚀 Starting deployment of InsuranceContract...");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "FLR/C2FLR");
  
  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  
  // Deploy InsuranceContract
  console.log("\n📋 Deploying InsuranceContract...");
  const InsuranceContract = await hre.ethers.getContractFactory("InsuranceContract");
  const insurance = await InsuranceContract.deploy();
  
  await insurance.waitForDeployment();
  const insuranceAddress = await insurance.getAddress();
  
  console.log("✅ InsuranceContract deployed to:", insuranceAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contract: "InsuranceContract",
    address: insuranceAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Instructions for Flare explorer
  if (network.chainId === 114n) {
    console.log("\n🔍 View on Coston2 Explorer:");
    console.log(`https://coston2-explorer.flare.network/address/${insuranceAddress}`);
  } else if (network.chainId === 14n) {
    console.log("\n🔍 View on Flare Explorer:");
    console.log(`https://flare-explorer.flare.network/address/${insuranceAddress}`);
  }
  
  console.log("\n✨ Deployment completed successfully!");
  console.log("\n💡 To interact with the contract, update CONTRACT_ADDRESS in scripts/interact.ts");
  
  return insuranceAddress;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

