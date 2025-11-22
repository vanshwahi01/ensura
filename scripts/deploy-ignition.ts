import hre from "hardhat";
import InsuranceContractModule from "../ignition/modules/InsuranceContract";

async function main() {
  console.log("🚀 Starting deployment of InsuranceContract to Flare...");
  
  // Connect to the network
  const connection = await hre.network.connect();
  
  // Get network info
  const network = await connection.ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  
  // Get deployer account
  const [deployer] = await connection.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await connection.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", connection.ethers.formatEther(balance), "FLR/C2FLR");
  
  if (balance === 0n) {
    throw new Error("Account has no balance. Please get testnet tokens from the faucet.");
  }
  
  // Deploy using Ignition
  console.log("\n📋 Deploying InsuranceContract...");
  const { insurance } = await connection.ignition.deploy(InsuranceContractModule);
  
  const contractAddress = await insurance.getAddress();
  console.log("✅ InsuranceContract deployed to:", contractAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.chainId === 114n ? "coston2" : network.chainId === 14n ? "flare" : "unknown",
    chainId: network.chainId.toString(),
    contract: "InsuranceContract",
    address: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Explorer link
  if (network.chainId === 114n) {
    console.log("\n🔍 View on Coston2 Explorer:");
    console.log(`https://coston2-explorer.flare.network/address/${contractAddress}`);
  } else if (network.chainId === 14n) {
    console.log("\n🔍 View on Flare Explorer:");
    console.log(`https://flare-explorer.flare.network/address/${contractAddress}`);
  }
  
  console.log("\n✨ Deployment completed successfully!");
  console.log("\n💡 Contract address:", contractAddress);
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

