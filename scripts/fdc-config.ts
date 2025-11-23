/**
 * FDC Configuration for Ensura Insurance dApp
 * 
 * Centralized configuration for Flare Data Connector integration
 * on Coston2 testnet (with mainnet configs for future deployment)
 */

export const FDC_CONFIG = {
  // Network configurations
  networks: {
    coston2: {
      name: "Flare Testnet Coston2",
      chainId: 114,
      rpcUrl: "https://coston2-api.flare.network/ext/C/rpc",
      
      // FDC Contract Addresses
      fdcHub: "0x7B0c357876670D9c0Bb1C0e62e5b33a0fc47E8F7",
      fdcVerification: "0x0c13aDA1C7143Cf0a0795FFaB93eEBb6FAD6e4e3",
      relay: "0x0c13aDA1C7143Cf0a0795FFaB93eEBb6FAD6e4e3",
      
      // API Endpoints
      verifierUrl: "https://fdc-verifier-coston2.flare.network",
      daLayerUrl: "https://da-coston2.flare.network",
      explorerUrl: "https://coston2-explorer.flare.network",
      
      // Fees
      attestationFee: "0.001", // FLR
    },
    
    flare: {
      name: "Flare Mainnet",
      chainId: 14,
      rpcUrl: "https://flare-api.flare.network/ext/C/rpc",
      
      // FDC Contract Addresses (update when deploying to mainnet)
      fdcHub: "TBD",
      fdcVerification: "TBD",
      relay: "TBD",
      
      // API Endpoints
      verifierUrl: "https://fdc-verifier.flare.network",
      daLayerUrl: "https://da-layer.flare.network",
      explorerUrl: "https://flare-explorer.flare.network",
      
      // Fees
      attestationFee: "0.005", // FLR (higher on mainnet)
    },
  },
  
  // Attestation Types
  attestationTypes: {
    web2Json: {
      name: "Web2Json",
      sourceId: "PublicWeb2",
      description: "Attest data from public Web2 APIs",
      prepareEndpoint: "/verifier/web2json/prepareRequest",
    },
    evmTransaction: {
      name: "EVMTransaction",
      sourceId: "ETH",
      description: "Attest Ethereum blockchain transactions",
      prepareEndpoint: "/verifier/evm/prepareRequest",
    },
    payment: {
      name: "Payment",
      sourceId: "BTC",
      description: "Attest payment transactions",
      prepareEndpoint: "/verifier/payment/prepareRequest",
    },
  },
  
  // Default settings
  defaults: {
    network: "coston2",
    httpMethod: "GET",
    headers: "{}",
    queryParams: "{}",
    body: "{}",
    attestationTimeout: 180, // seconds
    proofRetryAttempts: 3,
    proofRetryDelay: 10, // seconds
  },
};

/**
 * Get network configuration
 */
export function getNetworkConfig(network: "coston2" | "flare" = "coston2") {
  return FDC_CONFIG.networks[network];
}

/**
 * Get current network from environment
 */
export function getCurrentNetwork(): "coston2" | "flare" {
  const network = process.env.NEXT_PUBLIC_FLARE_NETWORK || "coston2";
  return network as "coston2" | "flare";
}

/**
 * Get attestation type configuration
 */
export function getAttestationType(type: keyof typeof FDC_CONFIG.attestationTypes) {
  return FDC_CONFIG.attestationTypes[type];
}

/**
 * Insurance-specific data structures for FDC attestation
 */
export const INSURANCE_ABI_SIGNATURES = {
  // Quote data structure
  quote: {
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
      { internalType: "string", name: "responseHash", type: "string" },
    ],
    name: "insuranceQuote",
    type: "tuple",
  },
  
  // Claim evidence structure
  claimEvidence: {
    components: [
      { internalType: "string", name: "claimId", type: "string" },
      { internalType: "string", name: "offerId", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "string", name: "evidenceType", type: "string" },
      { internalType: "string", name: "evidenceUrl", type: "string" },
      { internalType: "bool", name: "verified", type: "bool" },
      { internalType: "uint256", name: "verificationScore", type: "uint256" },
    ],
    name: "claimEvidence",
    type: "tuple",
  },
  
  // Risk assessment structure
  riskAssessment: {
    components: [
      { internalType: "address", name: "requesterAddress", type: "address" },
      { internalType: "uint256", name: "riskScore", type: "uint256" },
      { internalType: "string", name: "riskCategory", type: "string" },
      { internalType: "uint256", name: "assessmentDate", type: "uint256" },
      { internalType: "string[]", name: "riskFactors", type: "string[]" },
    ],
    name: "riskAssessment",
    type: "tuple",
  },
};

/**
 * JQ Filters for insurance data extraction
 */
export const INSURANCE_JQ_FILTERS = {
  quote: `{
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
  }`,
  
  claimEvidence: `{
    claimId: .claimId,
    offerId: .offerId,
    timestamp: .timestamp,
    evidenceType: .evidenceType,
    evidenceUrl: .evidenceUrl,
    verified: .verified,
    verificationScore: .verificationScore
  }`,
  
  riskAssessment: `{
    requesterAddress: .requesterAddress,
    riskScore: .riskScore,
    riskCategory: .riskCategory,
    assessmentDate: .assessmentDate,
    riskFactors: .riskFactors
  }`,
};

/**
 * Environment variable validation
 */
export function validateFdcEnvironment(): {
  valid: boolean;
  missing: string[];
} {
  const required = [
    "FDC_API_KEY",
    "NEXT_PUBLIC_FLARE_NETWORK",
    "INSURANCE_CONTRACT_ADDRESS",
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Log FDC configuration (for debugging)
 */
export function logFdcConfig() {
  const network = getCurrentNetwork();
  const config = getNetworkConfig(network);
  
  console.log("\n🔧 FDC Configuration:");
  console.log("  Network:", config.name);
  console.log("  Chain ID:", config.chainId);
  console.log("  FDC Hub:", config.fdcHub);
  console.log("  Verifier URL:", config.verifierUrl);
  console.log("  DA Layer:", config.daLayerUrl);
  
  const envCheck = validateFdcEnvironment();
  if (!envCheck.valid) {
    console.log("\n⚠️  Missing environment variables:");
    envCheck.missing.forEach(key => console.log(`    - ${key}`));
  } else {
    console.log("\n✅ All environment variables configured");
  }
}

