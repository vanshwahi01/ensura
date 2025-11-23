import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

/**
 * Backend API for requesting Pyth Entropy random numbers
 * This route has access to private keys and can sign transactions
 */

const PYTH_ENTROPY_CONFIG = {
  entropyContract: process.env.PYTH_ENTROPY_ADDRESS || '0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF',
  provider: process.env.FLARE_RPC_URL || 'https://coston2-api.flare.network/ext/C/rpc',
  providerAddress: process.env.ENTROPY_PROVIDER || '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344',
  explorerUrl: 'https://coston2-explorer.flare.network',
};

const ENTROPY_ABI = [
  'function request(address provider, bytes32 userCommitment, bool useBlockHash) external payable returns (uint64 sequenceNumber)',
  'function reveal(address provider, uint64 sequenceNumber, bytes32 userRandomNumber, bytes32 providerRevelation) external',
  'function getRevealedRandomNumber(address provider, uint64 sequenceNumber) external view returns (bytes32 randomNumber)',
  'function getFee(address provider) external view returns (uint128 fee)',
  'event RandomnessRequest(uint64 indexed sequenceNumber, address indexed provider, bytes32 userCommitment)',
];

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    console.log(`🎲 [Pyth Entropy API] Action: ${action}`);
    console.log(`📋 [Pyth Entropy API] Contract: ${PYTH_ENTROPY_CONFIG.entropyContract}`);

    // Check if we have a private key configured
    if (!process.env.ENTROPY_SIGNER_PRIVATE_KEY) {
      console.warn('⚠️ [Pyth Entropy] No private key configured, using mock response');
      return handleMockRequest(action);
    }

    if (action === 'request') {
      return await handleRequestRandomNumber();
    } else if (action === 'reveal') {
      const { sequenceNumber, userRandomNumber } = await request.json();
      return await handleRevealRandomNumber(sequenceNumber, userRandomNumber);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "request" or "reveal"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ [Pyth Entropy API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process Pyth Entropy request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle request for random number
 */
async function handleRequestRandomNumber() {
  try {
    // Generate user commitment
    const userRandomBytes = ethers.randomBytes(32);
    const userRandomNumber = ethers.hexlify(userRandomBytes);
    const userCommitment = ethers.keccak256(userRandomBytes);

    console.log(`🔐 [Pyth Entropy] User Commitment: ${userCommitment}`);

    // Connect to provider
    const provider = new ethers.JsonRpcProvider(PYTH_ENTROPY_CONFIG.provider);
    const wallet = new ethers.Wallet(process.env.ENTROPY_SIGNER_PRIVATE_KEY!, provider);

    console.log(`📍 [Pyth Entropy] Signer address: ${wallet.address}`);

    // Create contract instance
    const entropyContract = new ethers.Contract(
      PYTH_ENTROPY_CONFIG.entropyContract,
      ENTROPY_ABI,
      wallet
    );

    // Get fee
    const fee = await entropyContract.getFee(PYTH_ENTROPY_CONFIG.providerAddress);
    console.log(`💰 [Pyth Entropy] Fee: ${ethers.formatEther(fee)} FLR`);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💵 [Pyth Entropy] Wallet balance: ${ethers.formatEther(balance)} FLR`);

    if (balance < fee) {
      throw new Error(`Insufficient balance. Need ${ethers.formatEther(fee)} FLR, have ${ethers.formatEther(balance)} FLR`);
    }

    // Submit request
    console.log(`📤 [Pyth Entropy] Submitting request transaction...`);
    const tx = await entropyContract.request(
      PYTH_ENTROPY_CONFIG.providerAddress,
      userCommitment,
      true, // useBlockHash
      { value: fee }
    );

    console.log(`⏳ [Pyth Entropy] Waiting for confirmation... TX: ${tx.hash}`);
    const receipt = await tx.wait();

    // Extract sequence number from event
    const requestEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = entropyContract.interface.parseLog(log);
        return parsed?.name === 'RandomnessRequest';
      } catch {
        return false;
      }
    });

    let sequenceNumber = '0';
    if (requestEvent) {
      const parsed = entropyContract.interface.parseLog(requestEvent);
      sequenceNumber = parsed?.args?.sequenceNumber?.toString() || '0';
    }

    console.log(`✅ [Pyth Entropy] Request successful!`);
    console.log(`📝 [Pyth Entropy] Sequence Number: ${sequenceNumber}`);
    console.log(`🔗 [Pyth Entropy] TX: ${PYTH_ENTROPY_CONFIG.explorerUrl}/tx/${tx.hash}`);

    return NextResponse.json({
      success: true,
      sequenceNumber,
      txHash: tx.hash,
      userCommitment,
      userRandomNumber,
      explorerLink: `${PYTH_ENTROPY_CONFIG.explorerUrl}/tx/${tx.hash}`,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error('❌ [Pyth Entropy] Request failed:', error);
    throw error;
  }
}

/**
 * Handle reveal and get random number
 */
async function handleRevealRandomNumber(sequenceNumber: string, userRandomNumber: string) {
  try {
    console.log(`🔓 [Pyth Entropy] Revealing for sequence ${sequenceNumber}...`);

    const provider = new ethers.JsonRpcProvider(PYTH_ENTROPY_CONFIG.provider);
    const entropyContract = new ethers.Contract(
      PYTH_ENTROPY_CONFIG.entropyContract,
      ENTROPY_ABI,
      provider
    );

    // Try to get revealed random number
    try {
      const randomNumber = await entropyContract.getRevealedRandomNumber(
        PYTH_ENTROPY_CONFIG.providerAddress,
        sequenceNumber
      );

      console.log(`✅ [Pyth Entropy] Random number: ${randomNumber}`);

      return NextResponse.json({
        success: true,
        randomNumber,
        sequenceNumber,
      });
    } catch (error) {
      // If not revealed yet, return pending status
      console.log(`⏳ [Pyth Entropy] Random number not revealed yet`);
      return NextResponse.json({
        success: false,
        pending: true,
        message: 'Random number not revealed by provider yet. Please wait and try again.',
        sequenceNumber,
      });
    }
  } catch (error) {
    console.error('❌ [Pyth Entropy] Reveal failed:', error);
    throw error;
  }
}

/**
 * Mock handler for when no private key is configured
 */
function handleMockRequest(action: string) {
  console.log('💻 [Pyth Entropy] Using MOCK response (no private key configured)');

  if (action === 'request') {
    const mockSequenceNumber = Date.now().toString();
    const mockTxHash = ethers.keccak256(ethers.toUtf8Bytes(`mock_${mockSequenceNumber}`));
    const userRandomBytes = ethers.randomBytes(32);
    const userRandomNumber = ethers.hexlify(userRandomBytes);
    const userCommitment = ethers.keccak256(userRandomBytes);

    return NextResponse.json({
      success: true,
      mock: true,
      sequenceNumber: mockSequenceNumber,
      txHash: mockTxHash,
      userCommitment,
      userRandomNumber,
      explorerLink: `${PYTH_ENTROPY_CONFIG.explorerUrl}/tx/${mockTxHash}`,
      message: 'Mock response - configure ENTROPY_SIGNER_PRIVATE_KEY for real on-chain requests',
    });
  } else {
    const mockRandomNumber = ethers.hexlify(ethers.randomBytes(32));

    return NextResponse.json({
      success: true,
      mock: true,
      randomNumber: mockRandomNumber,
      message: 'Mock response - configure ENTROPY_SIGNER_PRIVATE_KEY for real on-chain requests',
    });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Pyth Entropy API',
    contract: PYTH_ENTROPY_CONFIG.entropyContract,
    provider: PYTH_ENTROPY_CONFIG.providerAddress,
    explorer: PYTH_ENTROPY_CONFIG.explorerUrl,
    configured: !!process.env.ENTROPY_SIGNER_PRIVATE_KEY,
    endpoints: {
      request: 'POST /api/pyth-entropy with { action: "request" }',
      reveal: 'POST /api/pyth-entropy with { action: "reveal", sequenceNumber, userRandomNumber }',
    },
  });
}

