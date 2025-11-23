'use client'

import { IDKitWidget, ISuccessResult, VerificationLevel } from '@worldcoin/idkit'
import { Button } from '@/app/components/ui/button'
import { Shield, CheckCircle2, Globe } from 'lucide-react'

interface WorldIDVerificationProps {
  onSuccess: (result: ISuccessResult) => void
  onError?: (error: Error) => void
}

export default function WorldIDVerification({ onSuccess, onError }: WorldIDVerificationProps) {
  const handleVerify = async (proof: ISuccessResult) => {
    try {
      // Send proof to backend for verification
      const response = await fetch('/api/worldid/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof: proof.proof,
          merkle_root: proof.merkle_root,
          nullifier_hash: proof.nullifier_hash,
          verification_level: proof.verification_level,
        }),
      });

      if (!response.ok) {
        throw new Error('Verification failed on server');
      }

      const data = await response.json();
      
      if (data.success) {
        onSuccess(proof);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  const handleError = (error: Error) => {
    console.error('World ID Error:', error);
    if (onError) {
      onError(error);
    }
  };

  // Get app_id from environment variable or use staging for demo
  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID || 'app_staging_b4e6e14f3566f6e3d2f8e2a3c1b0a9d8';
  const action = process.env.NEXT_PUBLIC_WORLD_ACTION || 'insurance-verification';

  return (
    <div className="w-full">
      <IDKitWidget
        app_id={appId}
        action={action}
        onSuccess={handleVerify}
        onError={handleError}
        verification_level={VerificationLevel.Device}
        signal=""
        enableTelemetry
      >
        {({ open }) => (
          <Button
            onClick={open}
            size="lg"
            className="w-full font-semibold tracking-wide text-base py-6"
            style={{ 
              backgroundColor: 'var(--teal)',
              fontFamily: "'Outfit', sans-serif"
            }}
            aria-label="Verify your identity with World ID"
          >
            <Globe className="w-5 h-5 mr-2" />
            Verify with World ID
          </Button>
        )}
      </IDKitWidget>
    </div>
  );
}

