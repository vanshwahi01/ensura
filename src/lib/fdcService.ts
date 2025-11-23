/**
 * FDC Service for Frontend
 * 
 * Simplified service for interacting with FDC attestation from the browser
 */

export interface InsuranceQuote {
  id: string;
  premium: string;
  coverageAmount: string;
  riskScore: number;
  validUntil: number;
  response: string;
  fdcUrl: string;
}

export interface AttestationStatus {
  status: 'pending' | 'submitted' | 'finalizing' | 'completed' | 'failed';
  roundId?: number;
  message: string;
  proof?: any;
}

/**
 * Generate insurance quote using 0G AI
 */
export async function generateInsuranceQuote(
  userInput: string,
  requesterAddress: string
): Promise<{ quote: InsuranceQuote; success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/insurance/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput,
        requesterAddress,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to generate quote',
        quote: null as any,
      };
    }

    const data = await response.json();
    return {
      success: true,
      quote: data.quote,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      quote: null as any,
    };
  }
}

/**
 * Request FDC attestation for a quote
 * This would typically call a backend endpoint that handles the FDC flow
 */
export async function requestAttestationproofOptions(quoteId: string): Promise<{
  success: boolean;
  roundId?: number;
  abiEncodedRequest?: string;
  error?: string;
}> {
  try {
    // In production, create a backend endpoint /api/fdc/request-attestation
    // that handles the FDC workflow server-side
    
    const response = await fetch('/api/fdc/request-attestation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to request attestation',
      };
    }

    const data = await response.json();
    return {
      success: true,
      roundId: data.roundId,
      abiEncodedRequest: data.abiEncodedRequest,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Poll attestation status
 */
export async function pollAttestationStatus(
  roundId: number,
  maxAttempts: number = 30,
  intervalMs: number = 5000
): Promise<AttestationStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/fdc/attestation-status?roundId=${roundId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'completed') {
          return {
            status: 'completed',
            roundId,
            message: 'Attestation completed successfully',
            proof: data.proof,
          };
        }
        
        if (data.status === 'failed') {
          return {
            status: 'failed',
            roundId,
            message: data.message || 'Attestation failed',
          };
        }
        
        // Still pending/finalizing
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } else {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    } catch (error) {
      console.error('Error polling attestation status:', error);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  return {
    status: 'failed',
    roundId,
    message: 'Attestation timeout - exceeded maximum polling attempts',
  };
}

/**
 * Complete FDC workflow for insurance quote
 * 
 * This is a convenience function that:
 * 1. Generates the quote
 * 2. Requests FDC attestation
 * 3. Waits for completion
 * 4. Returns the verified quote with proof
 */
export async function generateVerifiedQuote(
  userInput: string,
  requesterAddress: string,
  onProgress?: (status: AttestationStatus) => void
): Promise<{
  success: boolean;
  quote?: InsuranceQuote;
  proof?: any;
  error?: string;
}> {
  // Step 1: Generate quote
  onProgress?.({
    status: 'pending',
    message: 'Generating insurance quote with 0G AI...',
  });

  const quoteResult = await generateInsuranceQuote(userInput, requesterAddress);
  
  if (!quoteResult.success) {
    return {
      success: false,
      error: quoteResult.error,
    };
  }

  // Step 2: Request FDC attestation
  onProgress?.({
    status: 'submitted',
    message: 'Requesting FDC attestation for quote...',
  });

  const attestationResult = await requestAttestationproofOptions(quoteResult.quote.id);
  
  if (!attestationResult.success) {
    return {
      success: false,
      quote: quoteResult.quote,
      error: attestationResult.error,
    };
  }

  // Step 3: Wait for attestation to complete
  onProgress?.({
    status: 'finalizing',
    roundId: attestationResult.roundId,
    message: 'Waiting for FDC attestation to finalize (~2 minutes)...',
  });

  const statusResult = await pollAttestationStatus(attestationResult.roundId!);
  
  if (statusResult.status !== 'completed') {
    return {
      success: false,
      quote: quoteResult.quote,
      error: statusResult.message,
    };
  }

  // Step 4: Return verified quote with proof
  onProgress?.({
    status: 'completed',
    roundId: attestationResult.roundId,
    message: 'Quote verified successfully!',
    proof: statusResult.proof,
  });

  return {
    success: true,
    quote: quoteResult.quote,
    proof: statusResult.proof,
  };
}

/**
 * Submit verified quote to smart contract
 * Requires Web3 wallet connection (e.g., MetaMask)
 */
export async function submitQuoteToContract(
  quoteId: string,
  proof: any,
  contractAddress: string,
  signer: any
): Promise<{
  success: boolean;
  transactionHash?: string;
  error?: string;
}> {
  try {
    // This would use ethers.js to interact with the contract
    // Example implementation:
    
    const contract = new (window as any).ethers.Contract(
      contractAddress,
      ['function getQuote(string memory metadata, tuple(bytes32[] merkleProof, tuple data) proof) external returns (uint256)'],
      signer
    );

    const tx = await contract.getQuote(
      `AI Quote: ${quoteId}`,
      {
        merkleProof: proof.merkleProof,
        data: proof.data,
      }
    );

    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Helper: Format premium for display
 */
export function formatPremium(premiumWei: string): string {
  // Convert from wei to USD (assuming 1e18 = $1)
  const premium = parseFloat(premiumWei) / 1e18;
  return `$${premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Helper: Format coverage amount for display
 */
export function formatCoverage(coverageWei: string): string {
  const coverage = parseFloat(coverageWei) / 1e18;
  return `$${coverage.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Helper: Get risk category from score
 */
export function getRiskCategory(riskScore: number): {
  label: string;
  color: string;
  description: string;
} {
  if (riskScore < 25) {
    return {
      label: 'Low Risk',
      color: 'green',
      description: 'Excellent health profile with minimal risk factors',
    };
  } else if (riskScore < 50) {
    return {
      label: 'Moderate Risk',
      color: 'yellow',
      description: 'Good health profile with some manageable risk factors',
    };
  } else if (riskScore < 75) {
    return {
      label: 'Elevated Risk',
      color: 'orange',
      description: 'Notable risk factors that may require special consideration',
    };
  } else {
    return {
      label: 'High Risk',
      color: 'red',
      description: 'Significant risk factors requiring careful assessment',
    };
  }
}

