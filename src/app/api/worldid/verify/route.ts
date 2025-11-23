import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { proof, merkle_root, nullifier_hash, verification_level } = await request.json();
    
    // Get app_id from environment variable
    const app_id = process.env.NEXT_PUBLIC_WORLD_APP_ID || 'app_staging_b4e6e14f3566f6e3d2f8e2a3c1b0a9d8';
    
    // Call World ID verification API
    const verifyRes = await fetch(
      `https://developer.worldcoin.org/api/v2/verify/${app_id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nullifier_hash,
          merkle_root,
          proof,
          verification_level,
          action: 'insurance-verification', // This should match your action in Developer Portal
        }),
      }
    );

    if (!verifyRes.ok) {
      const errorData = await verifyRes.json();
      console.error('World ID verification failed:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification failed',
          details: errorData 
        },
        { status: 400 }
      );
    }

    const verifyData = await verifyRes.json();
    
    return NextResponse.json({
      success: true,
      verified: true,
      nullifier_hash,
      verification_level,
      data: verifyData
    });
  } catch (error) {
    console.error('World ID verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error during verification',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

