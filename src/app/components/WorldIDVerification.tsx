'use client'

import { useEffect } from 'react'
import { IDKitWidget, ISuccessResult, VerificationLevel, IErrorState } from '@worldcoin/idkit'
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
    console.error = (...args: unknown[]) => {
      // Safely check if this is the DialogTitle warning
      if (
        args.length > 0 &&
        typeof args[0] === 'string' && 
        args[0].includes('DialogContent') && 
        args[0].includes('DialogTitle')
      ) {
        // Suppress this specific warning from IDKitWidget
        return
      }
      // Only call originalError if we have valid arguments
      if (args.length > 0) {
        originalError.apply(console, args)
      }
    }
    
    return () => {
      console.error = originalError
    }
  }, [])

  const handleIDKitError = (error: IErrorState) => {
    console.error('❌ IDKit Error:', error);
    if (onError) {
      // IErrorState may have code and other properties, handling them safely
      const errorObj = error as { code?: string; detail?: string };
      const errorMessage = errorObj.detail || errorObj.code || 'World ID verification failed';
      onError(new Error(errorMessage));
    }
  };

  const handleVerify = async (proof: ISuccessResult) => {
    try {
      console.log('✅ World ID proof received:', proof);
      
      // Send proof to backend for verification
      const response = await fetch('/api/worldid/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof: {
            proof: proof.proof,
            merkle_root: proof.merkle_root,
            nullifier_hash: proof.nullifier_hash,
            verification_level: proof.verification_level,
          },
          signal: 'user_value', // Match with the signal prop
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend verification failed:', errorData);
        throw new Error(errorData.error || 'Verification failed on server');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.detail || 'Verification failed');
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      if (onError) {
        onError(error as Error);
      }
      throw error; // Re-throw to show error in IDKit
    }
  };

  // Get app_id from environment variable or use your friend's app_id for testing
  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID || 'app_4020275d788fc6f5664d986dd931e5e6';
  const action = process.env.NEXT_PUBLIC_WORLD_ACTION || 'verify';

  return (
    <div className="w-full">
      <IDKitWidget
        app_id={appId as `app_${string}`}
        action={action}
        signal="user_value"
        onSuccess={onSuccess}
        handleVerify={handleVerify}
        onError={handleIDKitError}
        verification_level={VerificationLevel.Device}
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

