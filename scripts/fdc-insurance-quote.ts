/**
 * FDC Insurance Quote Attestation Script
 * 
 * This script demonstrates how to attest 0G AI-generated insurance quotes
 * using Flare's FDC Web2Json attestation type.
 * 
 * Flow:
 * 1. Generate insurance quote via 0G AI (stored in API)
 * 2. Prepare FDC Web2Json attestation request for the quote API
 * 3. Submit attestation to FDC
 * 4. Wait for attestation round to finalize
 * 5. Retrieve proof from Data Availability Layer
 * 6. Submit proof to InsuranceContract on Flare
 * 
 * Based on: https://dev.flare.network/fdc/guides/hardhat/web2-json
 */

import { ethers } from "ethers";
import hre from "hardhat";
import fetch from "node-fetch";
import fs from "fs";

// Configuration - Matching Flare's official example
const FDC_VERIFIER_URL = process.env.WEB2JSON_VERIFIER_URL_TESTNET || "https://web2json-verifier-test.flare.rocks/";
const FDC_API_KEY = process.env.FDC_API_KEY || "";
const DA_LAYER_URL = process.env.COSTON2_DA_LAYER_URL || "https://ctn2-data-availability.flare.network/";
// Vercel URL for FDC attestation (publicly accessible)
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// FDC Contract addresses on Coston2
const FDC_HUB_ADDRESS = "0x7B0c357876670D9c0Bb1C0e62e5b33a0fc47E8F7";

// Attestation type and source ID
const ATTESTATION_TYPE = "Web2Json";
const SOURCE_ID = "PublicWeb2";

/**
 * Utility functions for FDC
 */
function toHex(data: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += data.charCodeAt(i).toString(16);
  }
  return result.padEnd(64, "0");
}

function toUtf8HexString(data: string): string {
  return "0x" + toHex(data);
}

/**
 * Step 1: Generate insurance quote via 0G AI
 */
async function generateInsuranceQuote(
  userInput: string,
  requesterAddress: string
): Promise<{ quoteId: string; fdcUrl: string }> {
  console.log("\n📝 Generating insurance quote via 0G AI...");
  console.log("  API URL:", `${API_BASE_URL}/api/insurance/quote`);
  
  const response = await fetch(`${API_BASE_URL}/api/insurance/quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userInput,
      requesterAddress,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error Response:", errorText);
    throw new Error(`Failed to generate quote: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json() as any;
  
  console.log("✅ Quote generated:");
  console.log("  - Quote ID:", data.quote.id);
  console.log("  - Premium:", data.quote.premium);
  console.log("  - Coverage:", data.quote.coverageAmount);
  console.log("  - Risk Score:", data.quote.riskScore);
  console.log("  - FDC URL:", data.fdcUrl);

  return {
    quoteId: data.quote.id,
    fdcUrl: data.fdcUrl,
  };
}

/**
 * Step 2: Prepare FDC Web2Json attestation request
 */
async function prepareAttestationRequest(quoteUrl: string) {
  console.log("\n🔧 Preparing FDC attestation request...");

  const attestationType = toUtf8HexString(ATTESTATION_TYPE);
  const sourceId = toUtf8HexString(SOURCE_ID);

  // Define the ABI signature for the quote data structure
  const abiSignature = JSON.stringify({
    components: [
      { internalType: "string", name: "quoteId", type: "string" },
      { internalType: "address", name: "requesterAddress", type: "address" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "uint256", name: "premium", type: "uint256" },
      { internalType: "uint256", name: "coverageAmount", type: "uint256" },
      { internalType: "uint256", name: "riskScore", type: "uint256" },
      { internalType: "uint256", name: "validUntil", type: "uint256" },
      { internalType: "string", name: "aiProvider", type: "string" },
      { internalType: "string", name: "aiModel", type: "string" },
      { internalType: "string", name: "responseHash", type: "string" }
    ],
    name: "insuranceQuote",
    type: "tuple",
  });

  // JQ filter to extract and structure the data
  const postProcessJq = `{
    quoteId: .quoteId,
    requesterAddress: .requesterAddress,
    timestamp: .timestamp,
    premium: .premium,
    coverageAmount: .coverageAmount,
    riskScore: .riskScore,
    validUntil: .validUntil,
    aiProvider: .aiProvider,
    aiModel: .aiModel,
    responseHash: .responseHash
  }`;

  const requestBody = {
    url: quoteUrl,
    httpMethod: "GET",
    headers: "{}",
    queryParams: "{}",
    body: "{}",
    postProcessJq: postProcessJq,
    abiSignature: abiSignature,
  };

  const request = {
    attestationType: attestationType,
    sourceId: sourceId,
    requestBody: requestBody,
  };

  console.log("📤 Sending request to FDC verifier...");
  console.log("Verifier URL:", FDC_VERIFIER_URL);

  // Official Flare FDC endpoint format: /verifier/web2json/prepareRequest
  const response = await fetch(`${FDC_VERIFIER_URL}Web2Json/prepareRequest`, {
    method: "POST",
    headers: {
      "X-API-KEY": FDC_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Verifier request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any;
  console.log("✅ Attestation request prepared");
  console.log("  Response:", JSON.stringify(data, null, 2).substring(0, 200) + "...");
  
  // Check if the verifier returned an error status
  if (data.status && data.status.includes("INVALID")) {
    throw new Error(`FDC Verifier Error: ${data.status}. Check if your API endpoint is publicly accessible and returns valid JSON.`);
  }
  
  // Validate that we have the expected abiEncodedRequest
  if (!data.abiEncodedRequest) {
    throw new Error(`FDC Verifier did not return abiEncodedRequest. Response: ${JSON.stringify(data)}`);
  }
  
  return data.abiEncodedRequest;
}

/**
 * Step 3: Submit attestation request to FDC Hub
 */
async function submitAttestationRequest(abiEncodedRequest: string): Promise<number> {
  console.log("\n📡 Submitting attestation request to FDC Hub...");

  // Create provider and wallet
  const rpcUrl = process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not set");
  const signer = new ethers.Wallet(privateKey, provider);
  
  // Load FDC Hub ABI (simplified - just the requestAttestation function)
  const fdcHubAbi = [
    "function requestAttestation(bytes calldata data) external payable returns (uint256)"
  ];
  
  // Get FDC Hub contract
  const fdcHub = new ethers.Contract(FDC_HUB_ADDRESS, fdcHubAbi, signer);

  // Submit attestation request with fee
  const attestationFee = ethers.parseEther("0.001"); // 0.001 FLR
  
  const tx = await fdcHub.requestAttestation(abiEncodedRequest, {
    value: attestationFee,
  });

  console.log("📝 Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Attestation request submitted in block:", receipt.blockNumber);

  // Extract round ID from event
  // Note: Actual implementation depends on FDC Hub ABI
  const roundId = receipt.blockNumber; // Simplified - get from event in production
  
  console.log("📊 Attestation Round ID:", roundId);
  
  return roundId;
}

/**
 * Step 4: Wait for attestation round to finalize
 */
async function waitForRoundFinalization(roundId: number): Promise<void> {
  console.log("\n⏳ Waiting for attestation round to finalize...");
  console.log("  Round ID:", roundId);
  
  // FDC rounds typically finalize in 90-180 seconds on Coston2
  const estimatedWaitTime = 120; // 2 minutes
  
  console.log(`  Estimated wait time: ~${estimatedWaitTime} seconds`);
  console.log("  You can monitor round status at: https://fdc-api.flare.network/status");
  
  // In production, you would poll the FDC API for round status
  // For now, we'll wait the estimated time
  await new Promise(resolve => setTimeout(resolve, estimatedWaitTime * 1000));
  
  console.log("✅ Round should be finalized (verify at FDC API)");
}

/**
 * Step 5: Retrieve proof from Data Availability Layer
 */
async function retrieveProof(
  abiEncodedRequest: string,
  roundId: number
): Promise<any> {
  console.log("\n📥 Retrieving proof from Data Availability Layer...");

  const response = await fetch(`${DA_LAYER_URL}api/v1/fdc/proof-by-request-round-raw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roundId: roundId,
      requestBytes: abiEncodedRequest,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve proof: ${response.status} ${response.statusText}`);
  }

  const proof = await response.json() as any;
  
  console.log("✅ Proof retrieved successfully");
  console.log("  Merkle proof length:", proof.merkleProof?.length || 0);
  
  return proof;
}

/**
 * Step 6: Submit proof to InsuranceContract
 */
async function submitProofToContract(
  contractAddress: string,
  proof: any
): Promise<void> {
  console.log("\n📤 Submitting proof to InsuranceContract...");

  // Create provider and wallet
  const rpcUrl = process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not set");
  const signer = new ethers.Wallet(privateKey, provider);
  
  // Load contract ABI
  const contractPath = "./artifacts/contracts/InsuranceContract.sol/InsuranceContract.json";
  const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  
  const insuranceContract = new ethers.Contract(
    contractAddress,
    contractJson.abi,
    signer
  );

  // Decode response data for the contract
  const decodedResponse = ethers.AbiCoder.defaultAbiCoder().decode(
    ["tuple(string quoteId, address requesterAddress, uint256 timestamp, uint256 premium, uint256 coverageAmount, uint256 riskScore, uint256 validUntil, string aiProvider, string aiModel, string responseHash)"],
    proof.data.responseBody.abi_encoded_data
  );

  console.log("📊 Decoded quote data:");
  console.log("  Quote ID:", decodedResponse[0].quoteId);
  console.log("  Requester:", decodedResponse[0].requesterAddress);
  console.log("  Premium:", decodedResponse[0].premium.toString());
  console.log("  Coverage:", decodedResponse[0].coverageAmount.toString());

  // Submit to contract (example: creating quote request)
  const tx = await insuranceContract.getQuote(
    `AI Quote: ${decodedResponse[0].quoteId}`,
    {
      merkleProof: proof.merkleProof,
      data: proof.data,
    }
  );

  console.log("📝 Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Proof verified and submitted on-chain!");
  console.log("  Block:", receipt.blockNumber);
}

/**
 * Main function - Complete FDC attestation workflow
 */
async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("🔐 FDC Insurance Quote Attestation - Complete Workflow");
  console.log("=".repeat(80));

  const rpcUrl = process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const privateKey = process.env.PRIVATE_KEY;
  const vercelUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!privateKey) throw new Error("PRIVATE_KEY not set");
  const signer = new ethers.Wallet(privateKey, provider);

  // Get contract address from environment or deployment
  const contractAddress = process.env.INSURANCE_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("INSURANCE_CONTRACT_ADDRESS not set in environment");
  }

  try {
    // Step 1: Generate insurance quote
    const userInput = "I need health insurance coverage for $50,000. I'm a 30-year-old software engineer in good health. Respond concise and to the point in 2 sentences.";
    const { quoteId, fdcUrl } = await generateInsuranceQuote(userInput, signer.address);

    // Step 2: Prepare FDC attestation request
    const abiEncodedRequest = await prepareAttestationRequest(fdcUrl);

    // Step 3: Submit to FDC Hub
    const roundId = await submitAttestationRequest(abiEncodedRequest);

    // Step 4: Wait for finalization
    await waitForRoundFinalization(roundId);

    // Step 5: Retrieve proof
    const proof = await retrieveProof(abiEncodedRequest, roundId);

    // Step 6: Submit to contract
    await submitProofToContract(contractAddress, proof);

    console.log("\n" + "=".repeat(80));
    console.log("✅ COMPLETE! Insurance quote attested and verified on-chain");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("\n❌ Error during FDC attestation workflow:");
    console.error(error);
    process.exit(1);
  }
}

// Export functions for use in other scripts
export {
  generateInsuranceQuote,
  prepareAttestationRequest,
  submitAttestationRequest,
  waitForRoundFinalization,
  retrieveProof,
  submitProofToContract,
};

// Run the script if executed directly
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

