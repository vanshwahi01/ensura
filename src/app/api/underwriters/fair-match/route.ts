import { NextRequest, NextResponse } from 'next/server';
import { shuffleUnderwritersWithPythEntropy as shuffleUnderwritersWithEntropy, formatShuffleResult, type Underwriter } from '@/lib/entropyServiceOnChain';
import { verifyShuffleIntegrity } from '@/lib/entropyService';

/**
 * Fair Underwriter Matching API with Pyth Entropy
 * 
 * This endpoint provides fair, unbiased underwriter ordering using
 * Pyth Entropy for cryptographically secure randomness.
 * 
 * Key Features:
 * - No preferential ordering (richest, cheapest, newest)
 * - Equal exposure for all qualified underwriters
 * - Sybil resistance through verifiable randomness
 * - Full transparency with debug info
 * 
 * GET /api/underwriters/fair-match?type=health&requestId=xyz
 */

// Mock underwriter database (in production, fetch from blockchain)
const ALL_UNDERWRITERS: Underwriter[] = [
  {
    id: 'uw-001',
    name: 'Vitalik Buterin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VitalikButerin',
    reputation: 4.95,
    totalPoliciesUnderwritten: 342,
    activePolicies: 45,
    premiumMultiplier: 1.02,
    coverageLimit: 2000000,
    collateralLocked: 850000,
    specialties: ['Health', 'Life', 'Disability'],
    responseTime: '< 1 hour',
    claimApprovalRate: 99
  },
  {
    id: 'uw-002',
    name: 'Changpeng Zhao',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChangpengZhao',
    reputation: 4.88,
    totalPoliciesUnderwritten: 256,
    activePolicies: 38,
    premiumMultiplier: 1.04,
    coverageLimit: 1800000,
    collateralLocked: 720000,
    specialties: ['Business', 'Auto', 'Life'],
    responseTime: '< 2 hours',
    claimApprovalRate: 97
  },
  {
    id: 'uw-003',
    name: 'Brian Armstrong',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BrianArmstrong',
    reputation: 4.92,
    totalPoliciesUnderwritten: 198,
    activePolicies: 29,
    premiumMultiplier: 1.03,
    coverageLimit: 1500000,
    collateralLocked: 600000,
    specialties: ['Health', 'Home', 'Travel'],
    responseTime: '< 1 hour',
    claimApprovalRate: 98
  },
  {
    id: 'uw-004',
    name: 'Cathie Wood',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CathieWood',
    reputation: 4.85,
    totalPoliciesUnderwritten: 167,
    activePolicies: 24,
    premiumMultiplier: 1.06,
    coverageLimit: 1200000,
    collateralLocked: 480000,
    specialties: ['Life', 'Disability', 'Pet'],
    responseTime: '< 3 hours',
    claimApprovalRate: 96
  },
  {
    id: 'uw-005',
    name: 'Anatoly Yakovenko',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnatolyYakovenko',
    reputation: 4.90,
    totalPoliciesUnderwritten: 143,
    activePolicies: 19,
    premiumMultiplier: 1.05,
    coverageLimit: 1000000,
    collateralLocked: 400000,
    specialties: ['Auto', 'Travel', 'Business'],
    responseTime: '< 2 hours',
    claimApprovalRate: 97
  },
  {
    id: 'uw-006',
    name: 'Andre Cronje',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AndreCronje',
    reputation: 4.82,
    totalPoliciesUnderwritten: 124,
    activePolicies: 18,
    premiumMultiplier: 1.07,
    coverageLimit: 900000,
    collateralLocked: 360000,
    specialties: ['Health', 'Life', 'Auto'],
    responseTime: '< 4 hours',
    claimApprovalRate: 95
  },
  // MEME ENTRY - Always at bottom due to high premium
  {
    id: 'uw-999',
    name: 'Sam Bankman-Fried',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SBF',
    reputation: 1.2,
    totalPoliciesUnderwritten: 3,
    activePolicies: 0,
    premiumMultiplier: 8.99, // 🚨 SCAM ALERT - Nearly 9x premium!
    coverageLimit: 50000,
    collateralLocked: 0, // No collateral (sus!)
    specialties: ['Fraud', 'Ponzi', 'Rugpull'],
    responseTime: '< Never',
    claimApprovalRate: 3
  }
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const insuranceType = searchParams.get('type') || 'Health';
    const requestId = searchParams.get('requestId');
    const debug = searchParams.get('debug') === 'true';

    console.log('\n' + '='.repeat(80));
    console.log('🎲 PYTH ENTROPY FAIR UNDERWRITER MATCHING');
    console.log('='.repeat(80));
    console.log(`📝 Insurance Type: ${insuranceType}`);
    console.log(`🆔 Request ID: ${requestId || 'auto-generated'}`);
    console.log(`🔍 Debug Mode: ${debug ? 'ENABLED' : 'DISABLED'}`);

    // Step 1: Filter underwriters based on insurance type
    const matchedUnderwriters = ALL_UNDERWRITERS.filter(u => 
      u.specialties.some(s => s.toLowerCase().includes(insuranceType.toLowerCase()))
    );

    if (matchedUnderwriters.length === 0) {
      // If no exact matches, return all underwriters
      matchedUnderwriters.push(...ALL_UNDERWRITERS);
    }

    console.log(`\n📊 Matched ${matchedUnderwriters.length} underwriters for ${insuranceType}`);
    console.log(`   Original IDs: ${matchedUnderwriters.map(u => u.id).join(', ')}`);

    // Step 2: Apply Pyth Entropy fair shuffle
    console.log('\n🎲 Applying Pyth Entropy randomization...');
    const shuffleResult = await shuffleUnderwritersWithEntropy(
      matchedUnderwriters,
      requestId || undefined
    );

    // Step 3: Verify shuffle integrity
    const integrity = verifyShuffleIntegrity(
      matchedUnderwriters,
      shuffleResult.underwriters
    );

    if (!integrity.valid) {
      console.error('❌ Shuffle integrity check FAILED:', integrity.message);
      throw new Error(`Shuffle integrity check failed: ${integrity.message}`);
    }

    console.log(`\n✅ SHUFFLE COMPLETE - Fair ordering guaranteed`);
    console.log(`   Shuffled IDs: ${shuffleResult.underwriters.map(u => u.id).join(', ')}`);
    console.log(`   Random Seed: ${shuffleResult.randomSeed.substring(0, 16)}...`);

    // Step 4: Display detailed shuffle visualization
    if (debug) {
      console.log('\n' + formatShuffleResult(shuffleResult));
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ FAIR MATCHING COMPLETE');
    console.log('='.repeat(80) + '\n');

    // Return response
    return NextResponse.json({
      success: true,
      underwriters: shuffleResult.underwriters.map(u => ({
        ...u,
        // Remove internal metadata from API response
        _randomSeed: undefined,
        _orderIndex: undefined
      })),
      fairnessProof: {
        randomSeed: shuffleResult.randomSeed,
        timestamp: shuffleResult.timestamp,
        requestId: shuffleResult.requestId,
        entropySource: shuffleResult.verificationData.entropySource,
        method: shuffleResult.debugInfo.method,
        guarantee: shuffleResult.debugInfo.fairnessGuarantee
      },
      verification: {
        integrityCheck: integrity.valid,
        originalOrder: shuffleResult.verificationData.originalOrder,
        shuffledOrder: shuffleResult.verificationData.shuffledOrder
      },
      metadata: {
        totalMatched: shuffleResult.underwriters.length,
        insuranceType,
        message: shuffleResult.debugInfo.message
      }
    });

  } catch (error) {
    const err = error as Error;
    console.error('\n❌ ERROR in fair underwriter matching:', err);
    console.error('Stack:', err.stack);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform fair underwriter matching',
        message: err.message,
        fallbackStrategy: 'Using default ordering due to error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Request specific underwriter shuffle (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const { underwriters, requestId } = await request.json();

    if (!underwriters || !Array.isArray(underwriters)) {
      return NextResponse.json(
        { error: 'Invalid underwriters array' },
        { status: 400 }
      );
    }

    console.log('\n🎲 POST: Custom underwriter shuffle requested');
    console.log(`📊 Input: ${underwriters.length} underwriters`);

    const shuffleResult = await shuffleUnderwritersWithEntropy(
      underwriters,
      requestId
    );

    console.log('✅ POST: Shuffle complete\n');

    return NextResponse.json({
      success: true,
      result: shuffleResult
    });

  } catch (error) {
    const err = error as Error;
    console.error('❌ POST ERROR:', err);

    return NextResponse.json(
      {
        success: false,
        error: err.message
      },
      { status: 500 }
    );
  }
}

