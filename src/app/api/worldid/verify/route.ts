"use server";
import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof } from '@worldcoin/idkit-core/backend';
import { VerificationLevel } from '@worldcoin/idkit-core';

export type VerifyReply = {
  success: boolean;
  code?: string;
  attribute?: string | null;
  detail?: string;
};

interface IVerifyRequest {
  proof: {
    nullifier_hash: string;
    merkle_root: string;
    proof: string;
    verification_level: VerificationLevel;
  };
  signal?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { proof, signal } = await request.json() as IVerifyRequest;
    
    console.log('🔍 Verifying World ID proof...');
    console.log('Proof:', proof);
    console.log('Signal:', signal);
    
    // Get app_id from environment variable
    const app_id = (process.env.NEXT_PUBLIC_WORLD_APP_ID || 'app_4020275d788fc6f5664d986dd931e5e6') as `app_${string}`;
    const action = (process.env.NEXT_PUBLIC_WORLD_ACTION || 'verifyinsurance') as string;
    
    console.log('App ID:', app_id);
    console.log('Action:', action);
    
    try {
      const verifyRes = await verifyCloudProof(proof, app_id, action, signal);
      console.log('✅ World ID verification successful:', verifyRes);
      
      return NextResponse.json({
        success: true,
        verified: true,
        nullifier_hash: proof.nullifier_hash,
        verification_level: proof.verification_level,
        data: verifyRes
      });
    } catch (error) {
      console.error('❌ World ID verification failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification failed',
          detail: error instanceof Error ? error.message : 'Unknown error',
          code: 'verification_error'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ World ID verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error during verification',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

