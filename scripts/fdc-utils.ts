/**
 * FDC Utilities for Ensura Insurance dApp
 * 
 * This file contains helper functions for interacting with Flare Data Connector (FDC)
 * to request and verify attestations for underwriting data, risk assessments, and claims.
 * 
 * Based on: https://dev.flare.network/fdc/getting-started
 */

import { ethers } from "ethers";

// FDC Configuration
export const FDC_CONFIG = {
  // Coston2 Testnet
  coston2: {
    verifierBaseUrl: "https://fdc-verifiers-testnet.flare.network/",
    daLayerBaseUrl: "https://fdc-da-testnet.flare.network/",
    fdcVerificationAddress: "0x3A1b94F0E4241e8C9c72De2c201dbA04f45847C8", // Coston2 FDC Verification
    network: "testETH", // For Sepolia/testnet external data
  },
  // Flare Mainnet
  flare: {
    verifierBaseUrl: "https://fdc-verifiers.flare.network/",
    daLayerBaseUrl: "https://fdc-da.flare.network/",
    fdcVerificationAddress: "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b", // TODO: Get from Flare docs
    network: "ETH",
  },
};

/**
 * Convert string to hex-padded 32 bytes
 */
export function toHex32(data: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += data.charCodeAt(i).toString(16);
  }
  return "0x" + result.padEnd(64, "0");
}

/**
 * Interface for Web2Json attestation request
 */
export interface Web2JsonRequest {
  url: string;
  postProcessJq?: string;
  abiSignature: string[];
}

/**
 * Prepare a Web2Json attestation request for underwriting data
 * 
 * @param network - Network identifier ('coston2' or 'flare')
 * @param apiUrl - URL of your API endpoint that returns underwriting data
 * @param jqFilter - Optional JQ filter to transform the JSON response
 * @param abiSignature - Array of ABI types matching the expected response structure
 * @param verifierApiKey - Your FDC verifier API key
 * @returns The encoded attestation request
 */
export async function prepareUnderwritingAttestation(
  network: "coston2" | "flare",
  apiUrl: string,
  jqFilter: string = ".",
  abiSignature: string[] = ["uint256", "string", "bool"],
  verifierApiKey: string
): Promise<any> {
  const config = FDC_CONFIG[network];
  
  const attestationType = toHex32("Web2Json");
  const sourceId = toHex32("WEB2");
  
  const requestData = {
    attestationType: attestationType,
    sourceId: sourceId,
    requestBody: {
      url: apiUrl,
      postProcessJq: jqFilter,
      abiSignature: abiSignature,
    },
  };

  const response = await fetch(
    `${config.verifierBaseUrl}verifier/web2/Web2Json/prepareRequest`,
    {
      method: "POST",
      headers: {
        "X-API-KEY": verifierApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    }
  );

  if (!response.ok) {
    throw new Error(`FDC verifier error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Submit an attestation request to FdcHub contract
 * 
 * @param signer - Ethers signer for the transaction
 * @param abiEncodedRequest - The encoded request from prepareAttestation
 * @param fdcHubAddress - Address of the FdcHub contract
 * @param fee - Fee to pay for attestation (in wei)
 * @returns Transaction receipt
 */
export async function submitAttestationRequest(
  signer: ethers.Signer,
  abiEncodedRequest: string,
  fdcHubAddress: string,
  fee: bigint
): Promise<ethers.ContractTransactionReceipt | null> {
  // FdcHub ABI (minimal)
  const fdcHubAbi = [
    "function requestAttestation(bytes calldata _data) external payable returns (bool)",
  ];

  const fdcHub = new ethers.Contract(fdcHubAddress, fdcHubAbi, signer);

  const tx = await fdcHub.requestAttestation(abiEncodedRequest, { value: fee });
  console.log("Attestation request submitted:", tx.hash);

  const receipt = await tx.wait();
  console.log("Attestation request confirmed in block:", receipt?.blockNumber);

  return receipt;
}

/**
 * Calculate the voting round ID from a block timestamp
 * 
 * Voting rounds are 90 seconds long on Flare
 */
export function calculateVotingRound(timestamp: number): number {
  const VOTING_ROUND_DURATION = 90; // seconds
  return Math.floor(timestamp / VOTING_ROUND_DURATION);
}

/**
 * Wait for a voting round to finalize
 * 
 * @param roundId - The voting round ID
 * @param relayAddress - Address of the Relay contract
 * @param provider - Ethers provider
 * @param maxWaitTime - Maximum time to wait in milliseconds (default: 5 minutes)
 * @returns True if finalized, false if timed out
 */
export async function waitForRoundFinalization(
  roundId: number,
  relayAddress: string,
  provider: ethers.Provider,
  maxWaitTime: number = 300000 // 5 minutes
): Promise<boolean> {
  const relayAbi = [
    "function isFinalized(uint256 _protocolId, uint256 _votingRoundId) external view returns (bool)",
  ];

  const relay = new ethers.Contract(relayAddress, relayAbi, provider);
  const FDC_PROTOCOL_ID = 200;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const isFinalized = await relay.isFinalized(FDC_PROTOCOL_ID, roundId);
      
      if (isFinalized) {
        console.log(`Round ${roundId} finalized!`);
        return true;
      }

      console.log(`Waiting for round ${roundId} to finalize...`);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Check every 10 seconds
    } catch (error) {
      console.error("Error checking finalization:", error);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  console.log(`Timeout waiting for round ${roundId} to finalize`);
  return false;
}

/**
 * Fetch attestation proof from DA Layer
 * 
 * @param network - Network identifier ('coston2' or 'flare')
 * @param roundId - The voting round ID
 * @param requestHash - Hash of the attestation request
 * @returns The proof data containing response and merkle proof
 */
export async function fetchAttestationProof(
  network: "coston2" | "flare",
  roundId: number,
  requestHash: string
): Promise<any> {
  const config = FDC_CONFIG[network];

  const response = await fetch(
    `${config.daLayerBaseUrl}api/proof/${roundId}/${requestHash}`
  );

  if (!response.ok) {
    throw new Error(`DA Layer error: ${response.statusText}`);
  }

  const proofData = await response.json();
  return proofData;
}

/**
 * Complete FDC attestation workflow
 * 
 * This function handles the entire process:
 * 1. Prepare attestation request
 * 2. Submit to FdcHub
 * 3. Wait for round finalization
 * 4. Fetch proof from DA Layer
 * 
 * @param network - Network identifier
 * @param signer - Ethers signer
 * @param apiUrl - URL of your data API
 * @param jqFilter - JQ filter for data transformation
 * @param abiSignature - ABI types for response
 * @param verifierApiKey - FDC verifier API key
 * @param fdcHubAddress - FdcHub contract address
 * @param relayAddress - Relay contract address
 * @param fee - Attestation fee in wei
 * @returns The proof data ready for contract submission
 */
export async function completeAttestationWorkflow(
  network: "coston2" | "flare",
  signer: ethers.Signer,
  apiUrl: string,
  jqFilter: string,
  abiSignature: string[],
  verifierApiKey: string,
  fdcHubAddress: string,
  relayAddress: string,
  fee: bigint
): Promise<any> {
  console.log("Starting FDC attestation workflow...");

  // Step 1: Prepare request
  console.log("Step 1: Preparing attestation request...");
  const prepared = await prepareUnderwritingAttestation(
    network,
    apiUrl,
    jqFilter,
    abiSignature,
    verifierApiKey
  );

  if (prepared.status !== "VALID") {
    throw new Error(`Attestation preparation failed: ${prepared.status}`);
  }

  // Step 2: Submit request
  console.log("Step 2: Submitting attestation request...");
  const receipt = await submitAttestationRequest(
    signer,
    prepared.abiEncodedRequest,
    fdcHubAddress,
    fee
  );

  if (!receipt) {
    throw new Error("Failed to submit attestation request");
  }

  const blockTimestamp = (await signer.provider!.getBlock(receipt.blockNumber))?.timestamp;
  if (!blockTimestamp) {
    throw new Error("Could not get block timestamp");
  }

  const roundId = calculateVotingRound(blockTimestamp);
  console.log(`Attestation submitted in voting round: ${roundId}`);

  // Step 3: Wait for finalization
  console.log("Step 3: Waiting for round finalization...");
  const finalized = await waitForRoundFinalization(
    roundId,
    relayAddress,
    signer.provider!
  );

  if (!finalized) {
    throw new Error("Round finalization timed out");
  }

  // Step 4: Fetch proof
  console.log("Step 4: Fetching proof from DA Layer...");
  const requestHash = ethers.keccak256(prepared.abiEncodedRequest);
  const proof = await fetchAttestationProof(network, roundId, requestHash);

  console.log("FDC attestation workflow completed successfully!");
  return proof;
}

/**
 * Example: Verify underwriting data for a quote request
 */
export async function verifyUnderwritingData(
  userAddress: string,
  age: number,
  occupation: string
): Promise<any> {
  // Example underwriting data structure
  return {
    userAddress,
    age,
    occupation,
    riskScore: age > 60 ? 8 : 5, // Simple risk calculation
    timestamp: Date.now(),
  };
}

/**
 * Example: Verify AI risk assessment for an offer
 */
export async function verifyRiskAssessment(
  quoteRequestId: number,
  aiModelOutput: any
): Promise<any> {
  // Example risk assessment structure
  return {
    quoteRequestId,
    recommendedPremium: aiModelOutput.premium,
    recommendedCoverage: aiModelOutput.coverage,
    confidenceScore: aiModelOutput.confidence,
    timestamp: Date.now(),
  };
}

/**
 * Example: Verify claim evidence
 */
export async function verifyClaimEvidence(
  offerId: number,
  evidenceType: string,
  evidenceUrl: string
): Promise<any> {
  // Example claim evidence structure
  return {
    offerId,
    evidenceType,
    evidenceUrl,
    verified: true,
    verifiedAt: Date.now(),
  };
}

