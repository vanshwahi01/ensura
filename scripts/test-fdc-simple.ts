/**
 * Simple FDC Test Script
 * Tests the deployed InsuranceContract and basic functionality
 */

import { ethers } from "ethers";
import fs from "fs";

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 Testing FDC Insurance Contract Deployment");
  console.log("=".repeat(80));

  // Create provider and wallet
  const rpcUrl = process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not set");
  const signer = new ethers.Wallet(privateKey, provider);
  console.log("\n👤 Signer address:", signer.address);

  // Get contract address from environment
  const contractAddress = process.env.INSURANCE_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("INSURANCE_CONTRACT_ADDRESS not set in environment");
  }

  console.log("📋 Contract address:", contractAddress);

  // Load contract ABI
  const contractPath = "./artifacts/contracts/InsuranceContract.sol/InsuranceContract.json";
  const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));

  // Get contract instance
  const insuranceContract = new ethers.Contract(
    contractAddress,
    contractJson.abi,
    signer
  );

  console.log("✅ Contract instance created");

  // Check FDC Verification address
  const fdcVerificationAddress = await insuranceContract.fdcVerification();
  console.log("🔐 FDC Verification address:", fdcVerificationAddress);

  // Check signer balance
  const balance = await provider.getBalance(signer.address);
  console.log("💰 Signer balance:", ethers.formatEther(balance), "C2FLR");

  console.log("\n" + "=".repeat(80));
  console.log("✅ All checks passed! Contract is deployed and accessible");
  console.log("=".repeat(80));
  
  console.log("\n📚 Next Steps:");
  console.log("1. Ensure dev server is running: npm run dev");
  console.log("2. Test quote API: POST http://localhost:3000/api/insurance/quote");
  console.log("3. Get FDC API key from Flare");
  console.log("4. Run full FDC workflow with scripts/fdc-insurance-quote.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });

