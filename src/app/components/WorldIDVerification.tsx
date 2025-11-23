'use client'

import { useEffect } from 'react'
import { IDKitWidget, ISuccessResult, VerificationLevel } from '@worldcoin/idkit'
import { Button } from '@/app/components/ui/button'
import { Globe } from 'lucide-react'

interface WorldIDVerificationProps {
  onSuccess: (result: ISuccessResult) => void
  onError?: (error: Error) => void
}

export default function WorldIDVerification({ onSuccess, onError }: WorldIDVerificationProps) {
  // Suppress the DialogTitle warning from IDKitWidget (third-party library issue)
  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' && 
        args[0].includes('DialogContent') && 
        args[0].includes('DialogTitle')
      ) {
        // Suppress this specific warning from IDKitWidget
        return
      }
      originalError.apply(console, args)
    }
    
    return () => {
      console.error = originalError
    }
  }, [])
  const handleVerify = async (proof: ISuccessResult) => {
    try {
      console.log('✅ World ID proof received:', proof);
      
      // For demo/development: Skip backend verification and directly call onSuccess
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 DEV MODE: Skipping backend verification');
        onSuccess(proof);
        return;
      }

      // Send proof to backend for verification (production)
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
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend verification failed:', errorData);
        throw new Error(errorData.error || 'Verification failed on server');
      }

      const data = await response.json();
      
      if (data.success) {
        onSuccess(proof);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Get app_id from environment variable or use staging for demo
  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID || 'app_staging_b4e6e14f3566f6e3d2f8e2a3c1b0a9d8';
  const action = process.env.NEXT_PUBLIC_WORLD_ACTION || 'verify-human';

  return (
    <div className="w-full">
      <IDKitWidget
        app_id={appId as `app_${string}`}
        action={action}
        onSuccess={handleVerify}
        verification_level={VerificationLevel.Device}
        handleVerify={handleVerify}
      >
        {({ open }) => (
          <Button
            type="button"
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

