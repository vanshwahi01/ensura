/**
 * Deployment script for Ensura Insurance Contract with FDC Integration
 * 
 * This script deploys the InsuranceContract with Flare Data Connector verification
 */

import { ethers } from "ethers";
import hre from "hardhat";
import fs from "fs";
// FDC Verification Contract Addresses
const FDC_VERIFICATION_ADDRESSES = {
  // Coston2 Testnet (lowercase to skip checksum)
  114: "0x3a1b94f0e4241e8c9c72de2c201dba04f45847c8",
  // Flare Mainnet
  14: "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b",
  // Localhost (mock address for testing)
  31337: "0x0000000000000000000000000000000000000001",
};

async function main() {
  console.log("🚀 Starting deployment of InsuranceContract with FDC integration...");
  
  // Get RPC URL - hardcoded for reliability
  const rpcUrl = process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
  
  // Create provider
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Create wallet from private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("No PRIVATE_KEY configured. Please set PRIVATE_KEY in .env file");
  }
  
  const deployer = new ethers.Wallet(privateKey, provider);
  console.log("Deploying with account:", deployer.address);
  
  // Check account balance
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "FLR/C2FLR");
  
  // Get network info
  const network = await provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  
  // Get FDC Verification address for this network
  const chainId = Number(network.chainId);
  const fdcVerificationAddress = FDC_VERIFICATION_ADDRESSES[chainId as keyof typeof FDC_VERIFICATION_ADDRESSES];
  
  if (!fdcVerificationAddress || fdcVerificationAddress.startsWith("0x...")) {
    console.warn("⚠️  WARNING: FDC Verification address not configured for this network!");
    console.warn("Please update the FDC_VERIFICATION_ADDRESSES in this script.");
    console.warn("Continuing with deployment, but contract will not function until address is updated.");
  }
  
  console.log("\n📋 FDC Configuration:");
  console.log("FDC Verification Address:", fdcVerificationAddress);
  
  // Deploy InsuranceContract
  console.log("\n📋 Deploying InsuranceContract...");
  
  // Read compiled contract
  const contractPath = "./artifacts/contracts/InsuranceContract.sol/InsuranceContract.json";
  const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  
  const factory = new ethers.ContractFactory(
    contractJson.abi,
    contractJson.bytecode,
    deployer
  );
  
  const insurance = await factory.deploy(fdcVerificationAddress);
  await insurance.waitForDeployment();
  const insuranceAddress = await insurance.target;
  
  console.log("✅ InsuranceContract deployed to:", insuranceAddress);
  
  // Verify the FDC Verification address is set correctly
  const contractFdcAddress = await insurance.fdcVerification();
  console.log("Contract FDC Verification:", contractFdcAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contract: "InsuranceContract",
    address: insuranceAddress,
    fdcVerification: fdcVerificationAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await provider.getBlockNumber(),
  };
  
  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Instructions for Flare explorer
  if (network.chainId === 114n) {
    console.log("\n🔍 View on Coston2 Explorer:");
    console.log(`https://coston2-explorer.flare.network/address/${insuranceAddress}`);
    console.log("\n📚 Next Steps:");
    console.log("1. Update your .env file with:");
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${insuranceAddress}`);
    console.log("2. Get FDC Verifier API key from Flare");
    console.log("3. Test FDC attestation workflow with scripts/example-fdc-workflow.ts");
  } else if (network.chainId === 14n) {
    console.log("\n🔍 View on Flare Explorer:");
    console.log(`https://flare-explorer.flare.network/address/${insuranceAddress}`);
    console.log("\n⚠️  MAINNET DEPLOYMENT - IMPORTANT:");
    console.log("1. Verify contract source code on explorer");
    console.log("2. Update frontend with contract address");
    console.log("3. Test thoroughly before production use");
  }
  
  console.log("\n✨ Deployment completed successfully!");
  console.log("\n💡 To interact with the contract:");
  console.log(`   npx hardhat run scripts/example-fdc-workflow.ts --network ${network.name}`);
  
  // Save deployment data to file
  const deploymentsDir = "./deployments";
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const filename = `${deploymentsDir}/deployment-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment data saved to: ${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

