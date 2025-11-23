import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { proof, merkle_root, nullifier_hash, verification_level } = await request.json();
    
    console.log('🔍 Verifying World ID proof...');
    
    // Get app_id from environment variable
    const app_id = process.env.NEXT_PUBLIC_WORLD_APP_ID || 'app_staging_b4e6e14f3566f6e3d2f8e2a3c1b0a9d8';
    const action = process.env.NEXT_PUBLIC_WORLD_ACTION || 'verify-human';
    
    // For development/staging, you might want to skip actual verification
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 DEV MODE: Bypassing World ID API verification');
      return NextResponse.json({
        success: true,
        verified: true,
        nullifier_hash,
        verification_level,
        dev_mode: true
      });
    }
    
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
          action,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      console.error('❌ World ID verification failed:', verifyData);
      return NextResponse.json(
        { 
          success: false, 
          error: verifyData.detail || 'Verification failed',
          code: verifyData.code,
          details: verifyData 
        },
        { status: 400 }
      );
    }

    console.log('✅ World ID verification successful');
    
    return NextResponse.json({
      success: true,
      verified: true,
      nullifier_hash,
      verification_level,
      data: verifyData
    });
  } catch (error) {
    console.error('❌ World ID verification error:', error);
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

