import * as React from 'react'
import Image from 'next/image'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './ui/modal'
import { Button } from './ui/button'
import { 
  CheckCircle2, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  Sparkles,
  FileText,
  Zap
} from 'lucide-react'
import { getTxExplorerUrl, getContractExplorerUrl, COSTON2_CONFIG, DEMO_CONTRACT_ADDRESS, REAL_OFFER_CREATION_TX } from '@/lib/contractService'

type TransactionStatus = 'preparing' | 'submitting' | 'pending' | 'success' | 'error'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  status: TransactionStatus
  txHash?: string
  offerId?: number
  error?: string
}

export function TransactionModal({
  isOpen,
  onClose,
  status,
  txHash,
  offerId,
  error
}: TransactionModalProps) {
  const isComplete = status === 'success' || status === 'error'
  const canClose = isComplete

  return (
    <Modal isOpen={isOpen} onClose={canClose ? onClose : () => {}}>
      <ModalHeader>
        <div className="text-center">
          {status === 'success' && (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 border-4 border-green-200 animate-scale-in">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 border-4 border-red-200">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
          {(status === 'preparing' || status === 'submitting' || status === 'pending') && (
            <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4 border-4 border-teal/20">
              <Loader2 className="w-8 h-8 text-teal animate-spin" />
            </div>
          )}
          
          <h2 
            className="text-2xl font-bold text-navy"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            {status === 'preparing' && 'Preparing Transaction'}
            {status === 'submitting' && 'Calling Smart Contract'}
            {status === 'pending' && 'Transaction Submitted'}
            {status === 'success' && 'Policy Bound Successfully!'}
            {status === 'error' && 'Transaction Failed'}
          </h2>
          {status === 'success' && (
            <p className="text-sm text-green-600 mt-2" style={{ fontFamily: "'Outfit', sans-serif" }}>🎉</p>
          )}
        </div>
      </ModalHeader>

      <ModalBody className="text-center">
        {/* Flare Network Badge */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 mb-4 border border-red-200">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🔥</span>
            <p className="text-xs font-bold text-red-900">
              Flare Coston2 • Chain ID: {COSTON2_CONFIG.chainId}
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {status === 'preparing' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Preparing your transaction parameters...
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 justify-center text-xs text-gray-700">
                <Sparkles className="w-4 h-4 text-teal animate-pulse" />
                <span style={{ fontFamily: "'Outfit', sans-serif" }}>Encoding transaction data</span>
              </div>
            </div>
          </div>
        )}

        {status === 'submitting' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Interacting with verified smart contract...
            </p>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 space-y-2">
              <div className="flex items-center gap-2 justify-center text-xs text-purple-900">
                <FileText className="w-4 h-4" />
                <code className="font-mono font-semibold">accept(uint256 offerId)</code>
              </div>
              {offerId !== undefined && (
                <p className="text-xs text-purple-700" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Binding Offer ID: <strong>#{offerId}</strong>
                </p>
              )}
            </div>
            <a
              href={getContractExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-dark"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              View Contract on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {status === 'pending' && txHash && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Waiting for blockchain confirmation...
            </p>
            <div className="bg-teal/5 rounded-lg p-4 border border-teal/20">
              <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Transaction Hash:</p>
              <code className="text-xs font-mono bg-white px-3 py-2 rounded border border-gray-200 block break-all">
                {txHash}
              </code>
            </div>
            <a
              href={getTxExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-dark font-semibold"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <ExternalLink className="w-3 h-3" />
              View on Coston2 Explorer
            </a>
          </div>
        )}

        {status === 'success' && txHash && (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-900 font-semibold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Your insurance policy is now active on Flare blockchain!
              </p>
              <p className="text-xs text-green-700" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Your policy is secured by a smart contract and can&apos;t be tampered with.
              </p>
            </div>

            {offerId !== undefined && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Offer ID:</p>
                <p className="text-2xl font-bold text-navy font-mono">#{offerId}</p>
              </div>
            )}

            <div className="bg-teal/5 rounded-lg p-4 border border-teal/20">
              <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Transaction Hash:</p>
              <code className="text-xs font-mono bg-white px-3 py-2 rounded border border-gray-200 block break-all">
                {txHash}
              </code>
            </div>

            <div className="flex gap-2 justify-center">
              <a
                href={`${COSTON2_CONFIG.explorerUrl}/tx/${REAL_OFFER_CREATION_TX}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-dark font-semibold bg-white px-3 py-2 rounded-lg border border-teal/20"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <Zap className="w-3 h-3" />
                See Offer Creation Transaction
              </a>
              <a
                href={getContractExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold bg-white px-3 py-2 rounded-lg border border-purple-200"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <FileText className="w-3 h-3" />
                View Contract
              </a>
            </div>

            {/* Flare Network Success Banner */}
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 border-2 border-blue-300 shadow-lg">
              <div className="flex items-start gap-3">
                {/* Flare Logo */}
                <div className="flex-shrink-0">
                  <Image 
                    src="/flare-logo.svg" 
                    alt="Flare Network" 
                    width={48} 
                    height={48}
                    className="rounded-lg"
                  />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-bold text-blue-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      Policy Secured on Flare Network
                    </p>
                  </div>
                  
                  <p className="text-xs text-blue-800 leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Your insurance policy is now stored on a <strong>verified smart contract</strong> deployed on Flare Coston2 testnet. The offer you accepted was created and funded on-chain with real blockchain transactions!
                  </p>

                  <div className="bg-white/80 rounded-lg p-2 border border-purple-200">
                    <p className="text-xs text-purple-900 leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      <strong>🔐 FDC Verification:</strong> Flare Data Connector (FDC) cryptographically verifies your insurance data from external sources before bringing it on-chain. This ensures your medical records, driving history, and identity documents are authentic and tamper-proof.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded px-2 py-1 border border-green-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="font-semibold">Click links above to view on Coston2 Explorer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Features */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <Zap className="w-5 h-5 text-teal mx-auto mb-1" />
                <p className="text-xs font-semibold text-navy" style={{ fontFamily: "'Outfit', sans-serif" }}>Instant</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-navy" style={{ fontFamily: "'Outfit', sans-serif" }}>Verified</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-navy" style={{ fontFamily: "'Outfit', sans-serif" }}>On-Chain</p>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-900 font-semibold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Transaction Failed
              </p>
              <p className="text-xs text-red-700" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {error || 'An error occurred while processing your transaction.'}
              </p>
            </div>
            <p className="text-xs text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Please try again or contact support if the issue persists.
            </p>
          </div>
        )}

        {/* Loading Animation */}
        {!isComplete && (
          <div className="mt-4 flex justify-center">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </ModalBody>

      {canClose && (
        <ModalFooter className="justify-center">
          <Button
            onClick={onClose}
            size="lg"
            className="font-semibold px-8"
            style={{ backgroundColor: status === 'success' ? 'var(--teal)' : 'var(--coral)' }}
          >
            {status === 'success' ? 'View My Policies' : 'Close'}
          </Button>
        </ModalFooter>
      )}
    </Modal>
  )
}

