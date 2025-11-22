/**
 * Example FDC Workflow for Ensura Insurance
 * 
 * This script demonstrates the complete workflow for:
 * 1. Requesting a quote with FDC-verified underwriting data
 * 2. Making an offer with FDC-verified AI risk assessment
 * 3. Claiming payout with FDC-verified claim evidence
 * 
 * Based on: https://dev.flare.network/fdc/getting-started
 */

import hre from "hardhat";
import {
  completeAttestationWorkflow,
  FDC_CONFIG,
  verifyUnderwritingData,
  verifyRiskAssessment,
  verifyClaimEvidence,
} from "./fdc-utils";

// Configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS";
const FDC_VERIFIER_API_KEY = process.env.FDC_VERIFIER_API_KEY || "YOUR_API_KEY";
const YOUR_API_BASE_URL = process.env.API_BASE_URL || "https://your-api.example.com";

// FdcHub addresses (on Coston2)
const FDC_HUB_ADDRESS = "0x7B0c357876670D9c0Bb1C0e62e5b33a0fc47E8F7"; // Coston2
const RELAY_ADDRESS = "0x0c13aDA1C7143Cf0a0795FFaB93eEBb6FAD6e4e3"; // Coston2

// Attestation fee (example: 0.001 FLR)
const ATTESTATION_FEE = hre.ethers.parseEther("0.001");

async function demonstrateQuoteRequest() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 PART 1: Request Quote with FDC-Verified Underwriting Data");
  console.log("=".repeat(70));

  const [requester] = await hre.ethers.getSigners();
  console.log("Requester:", requester.address);

  // Step 1: Prepare underwriting data
  console.log("\n1. Preparing underwriting data...");
  const underwritingData = await verifyUnderwritingData(
    requester.address,
    35, // age
    "Software Engineer" // occupation
  );
  console.log("Underwriting data:", underwritingData);

  // Step 2: Get FDC attestation for underwriting data
  console.log("\n2. Requesting FDC attestation for underwriting data...");
  console.log("⏳ This may take 2-3 minutes for the voting round to finalize...");

  try {
    const underwritingApiUrl = `${YOUR_API_BASE_URL}/underwriting/${requester.address}`;
    const abiSignature = ["address", "uint256", "string", "uint256", "uint256"]; // userAddress, age, occupation, riskScore, timestamp

    const proof = await completeAttestationWorkflow(
      "coston2",
      requester,
      underwritingApiUrl,
      ".", // No JQ transformation needed
      abiSignature,
      FDC_VERIFIER_API_KEY,
      FDC_HUB_ADDRESS,
      RELAY_ADDRESS,
      ATTESTATION_FEE
    );

    console.log("✅ FDC proof obtained!");

    // Step 3: Submit quote request to contract
    console.log("\n3. Submitting quote request to InsuranceContract...");
    const InsuranceContract = await hre.ethers.getContractAt(
      "InsuranceContract",
      CONTRACT_ADDRESS,
      requester
    );

    const metadata = JSON.stringify({
      type: "health_insurance",
      coverage_type: "comprehensive",
      requested_amount: hre.ethers.parseEther("10").toString(),
    });

    const tx = await InsuranceContract.getQuote(metadata, proof);
    const receipt = await tx.wait();

    console.log("✅ Quote request submitted!");
    console.log("Transaction hash:", receipt?.hash);

    // Extract quoteRequestId from events
    const quoteRequestedEvent = receipt?.logs.find((log: any) => {
      try {
        const parsed = InsuranceContract.interface.parseLog(log);
        return parsed?.name === "QuoteRequested";
      } catch {
        return false;
      }
    });

    if (quoteRequestedEvent) {
      const parsed = InsuranceContract.interface.parseLog(quoteRequestedEvent);
      console.log("Quote Request ID:", parsed?.args.quoteRequestId.toString());
    }
  } catch (error) {
    console.error("❌ Error in quote request workflow:", error);
  }
}

async function demonstrateOfferCreation(quoteRequestId: number) {
  console.log("\n" + "=".repeat(70));
  console.log("🤝 PART 2: Create Offer with FDC-Verified AI Risk Assessment");
  console.log("=".repeat(70));

  const [, provider] = await hre.ethers.getSigners();
  console.log("Provider:", provider.address);

  // Step 1: Run AI risk assessment
  console.log("\n1. Running AI risk assessment...");
  const aiModelOutput = {
    premium: hre.ethers.parseEther("0.5"),
    coverage: hre.ethers.parseEther("10"),
    confidence: 0.95,
  };
  const riskAssessment = await verifyRiskAssessment(quoteRequestId, aiModelOutput);
  console.log("Risk assessment:", riskAssessment);

  // Step 2: Get FDC attestation for risk assessment
  console.log("\n2. Requesting FDC attestation for risk assessment...");
  console.log("⏳ This may take 2-3 minutes for the voting round to finalize...");

  try {
    const riskAssessmentApiUrl = `${YOUR_API_BASE_URL}/risk-assessment/${quoteRequestId}`;
    const abiSignature = ["uint256", "uint256", "uint256", "uint256", "uint256"]; // quoteRequestId, premium, coverage, confidence (scaled), timestamp

    const proof = await completeAttestationWorkflow(
      "coston2",
      provider,
      riskAssessmentApiUrl,
      ".",
      abiSignature,
      FDC_VERIFIER_API_KEY,
      FDC_HUB_ADDRESS,
      RELAY_ADDRESS,
      ATTESTATION_FEE
    );

    console.log("✅ FDC proof obtained!");

    // Step 3: Fund coverage
    console.log("\n3. Funding coverage...");
    const InsuranceContract = await hre.ethers.getContractAt(
      "InsuranceContract",
      CONTRACT_ADDRESS,
      provider
    );

    const premium = hre.ethers.parseEther("0.5");
    const coverageAmount = hre.ethers.parseEther("10");
    const validUntil = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days

    // First, create the offer
    const offerTx = await InsuranceContract.offer(
      quoteRequestId,
      premium,
      coverageAmount,
      validUntil,
      proof
    );
    const offerReceipt = await offerTx.wait();

    console.log("✅ Offer created!");
    console.log("Transaction hash:", offerReceipt?.hash);

    // Extract offerId from events
    const offerMadeEvent = offerReceipt?.logs.find((log: any) => {
      try {
        const parsed = InsuranceContract.interface.parseLog(log);
        return parsed?.name === "OfferMade";
      } catch {
        return false;
      }
    });

    if (offerMadeEvent) {
      const parsed = InsuranceContract.interface.parseLog(offerMadeEvent);
      const offerId = parsed?.args.offerId;
      console.log("Offer ID:", offerId.toString());

      // Fund the coverage
      console.log("\n4. Funding coverage...");
      const fundTx = await InsuranceContract.fundCoverage(offerId, {
        value: coverageAmount,
      });
      await fundTx.wait();
      console.log("✅ Coverage funded!");

      return offerId;
    }
  } catch (error) {
    console.error("❌ Error in offer creation workflow:", error);
  }

  return null;
}

async function demonstrateClaimPayout(offerId: number) {
  console.log("\n" + "=".repeat(70));
  console.log("💰 PART 3: Claim Payout with FDC-Verified Claim Evidence");
  console.log("=".repeat(70));

  const [requester] = await hre.ethers.getSigners();
  console.log("Claimant:", requester.address);

  // Step 1: Collect claim evidence
  console.log("\n1. Collecting claim evidence...");
  const claimEvidence = await verifyClaimEvidence(
    offerId,
    "medical_report",
    "https://evidence-storage.example.com/report123.pdf"
  );
  console.log("Claim evidence:", claimEvidence);

  // Step 2: Get FDC attestation for claim evidence
  console.log("\n2. Requesting FDC attestation for claim evidence...");
  console.log("⏳ This may take 2-3 minutes for the voting round to finalize...");

  try {
    const claimEvidenceApiUrl = `${YOUR_API_BASE_URL}/claim-evidence/${offerId}`;
    const abiSignature = ["uint256", "string", "string", "bool", "uint256"]; // offerId, evidenceType, evidenceUrl, verified, verifiedAt

    const proof = await completeAttestationWorkflow(
      "coston2",
      requester,
      claimEvidenceApiUrl,
      ".",
      abiSignature,
      FDC_VERIFIER_API_KEY,
      FDC_HUB_ADDRESS,
      RELAY_ADDRESS,
      ATTESTATION_FEE
    );

    console.log("✅ FDC proof obtained!");

    // Step 3: Claim payout
    console.log("\n3. Claiming payout...");
    const InsuranceContract = await hre.ethers.getContractAt(
      "InsuranceContract",
      CONTRACT_ADDRESS,
      requester
    );

    const tx = await InsuranceContract.claimPayout(offerId, proof);
    const receipt = await tx.wait();

    console.log("✅ Payout claimed!");
    console.log("Transaction hash:", receipt?.hash);
  } catch (error) {
    console.error("❌ Error in claim payout workflow:", error);
  }
}

async function main() {
  console.log("🚀 Ensura Insurance - Complete FDC Workflow Example");
  console.log("═".repeat(70));

  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Contract Address:", CONTRACT_ADDRESS);
  console.log("═".repeat(70));

  // Check if we're on Coston2
  if (network.chainId !== 114n) {
    console.warn("⚠️  Warning: This example is configured for Coston2 testnet (chainId: 114)");
    console.warn("Please update the addresses if running on a different network.");
  }

  try {
    // Part 1: Request a quote
    await demonstrateQuoteRequest();

    // For the full workflow, you would:
    // 1. Note the quoteRequestId from Part 1
    // 2. Run Part 2 with that quoteRequestId
    // 3. Note the offerId from Part 2
    // 4. Accept the offer (call accept() function)
    // 5. Run Part 3 with that offerId

    console.log("\n" + "═".repeat(70));
    console.log("✨ Example workflow completed!");
    console.log("═".repeat(70));
    console.log("\n💡 Next Steps:");
    console.log("1. Extract the quoteRequestId from the events");
    console.log("2. Run demonstrateOfferCreation(quoteRequestId)");
    console.log("3. Extract the offerId from the events");
    console.log("4. Accept the offer by calling accept(offerId)");
    console.log("5. Run demonstrateClaimPayout(offerId)");
  } catch (error) {
    console.error("❌ Error in workflow:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

// Export functions for use in other scripts
export { demonstrateQuoteRequest, demonstrateOfferCreation, demonstrateClaimPayout };

