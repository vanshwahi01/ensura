import * as React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './ui/modal'
import { Button } from './ui/button'
import { Shield, ExternalLink, Wallet, FileText, Zap, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { 
  BindingDetails, 
  formatFLR, 
  getContractExplorerUrl,
  COSTON2_CONFIG,
  DEMO_CONTRACT_ADDRESS 
} from '@/lib/contractService'

interface BindingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  details: BindingDetails | null
  isLoading?: boolean
}

export function BindingModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  details,
  isLoading = false 
}: BindingModalProps) {
  if (!details) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal/20 to-coral/20 flex items-center justify-center border-2 border-white">
            {details.isAgency ? (
              <Shield className="w-6 h-6 text-teal" />
            ) : (
              <Wallet className="w-6 h-6 text-coral" />
            )}
          </div>
          <div>
            <h2 
              className="text-2xl font-bold text-navy"
              style={{ fontFamily: "'Crimson Text', serif" }}
            >
              Confirm Insurance Binding
            </h2>
            <p className="text-sm text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {details.isAgency ? 'Agency Insurance' : 'Peer-to-Peer Insurance'}
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Flare Network Badge */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 mb-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                <span className="text-lg">🔥</span>
              </div>
              <div>
                <p className="text-xs font-bold text-red-900">Powered by Flare Network</p>
                <p className="text-xs text-red-700">Coston2 Testnet</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-600 font-semibold">Chain ID: {COSTON2_CONFIG.chainId}</p>
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="space-y-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-xs font-bold text-navy mb-3 uppercase tracking-wide">
              Policy Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Insurance Type:</span>
                <span className="font-semibold text-navy">{details.insuranceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coverage Amount:</span>
                <span className="font-bold text-teal text-base">
                  {formatFLR(details.coverageAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Premium:</span>
                <span className="font-bold text-coral text-base">
                  {formatFLR(details.premium)}
                </span>
              </div>
            </div>
          </div>

          {/* Underwriter Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-xs font-bold text-navy mb-3 uppercase tracking-wide">
              {details.isAgency ? 'Provider' : 'Underwriter'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold text-navy">{details.underwriterName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Address:</span>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono text-gray-700">
                  {details.underwriterAddress.slice(0, 6)}...{details.underwriterAddress.slice(-4)}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Offer ID:</span>
                <span className="font-mono text-navy font-bold">#{details.offerId}</span>
              </div>
            </div>
          </div>

          {/* Smart Contract Info */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-2 mb-2">
              <FileText className="w-4 h-4 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wide mb-1">
                  Smart Contract
                </h3>
                <p className="text-xs text-purple-700 mb-2">
                  Your policy will be bound on-chain via verified smart contract
                </p>
                <a
                  href={getContractExplorerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  View Verified Contract
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-teal/5 rounded-lg p-3 text-center border border-teal/20">
              <Zap className="w-5 h-5 text-teal mx-auto mb-1" />
              <p className="text-xs font-semibold text-navy">Instant</p>
              <p className="text-xs text-gray-600">On-chain</p>
            </div>
            <div className="bg-teal/5 rounded-lg p-3 text-center border border-teal/20">
              <Shield className="w-5 h-5 text-teal mx-auto mb-1" />
              <p className="text-xs font-semibold text-navy">Secure</p>
              <p className="text-xs text-gray-600">FDC Verified</p>
            </div>
            <div className="bg-teal/5 rounded-lg p-3 text-center border border-teal/20">
              <FileText className="w-5 h-5 text-teal mx-auto mb-1" />
              <p className="text-xs font-semibold text-navy">Transparent</p>
              <p className="text-xs text-gray-600">Immutable</p>
            </div>
          </div>
        </div>

        {/* Flare Network Info Banner */}
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 border-2 border-blue-300 shadow-lg">
          <div className="flex items-start gap-3">
            {/* Flare Logo */}
            <div className="flex-shrink-0">
              <Image 
                src="/flare-logo.svg" 
                alt="Flare Network" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-blue-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Secured on Flare Network
                </p>
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">COSTON2</span>
              </div>
              
              <p className="text-xs text-blue-800 leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
                This offer is stored on a <strong>real deployed smart contract</strong>. Your policy data is verified using <strong>Flare Data Connector (FDC)</strong>, which securely fetches off-chain data and makes it available on-chain for trustless verification.
              </p>

              <div className="bg-white/70 rounded-lg p-2 border border-blue-200">
                <p className="text-xs text-blue-700 font-semibold mb-1">Contract Address:</p>
                <a
                  href={`${COSTON2_CONFIG.explorerUrl}/address/${DEMO_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs bg-white px-2 py-1 rounded border border-blue-300 inline-flex items-center gap-1 hover:bg-blue-100 transition-colors"
                >
                  {DEMO_CONTRACT_ADDRESS.slice(0, 10)}...{DEMO_CONTRACT_ADDRESS.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-start gap-2 bg-purple-100/50 rounded-lg p-2">
                <Shield className="w-4 h-4 text-purple-700 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-purple-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <strong>Why FDC?</strong> Flare's Data Connector ensures your insurance data (medical records, driving history) is cryptographically verified before being used in quotes, preventing fraud and ensuring accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          onClick={onClose}
          variant="outline"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          size="lg"
          className="font-semibold"
          style={{ backgroundColor: 'var(--coral)' }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Confirm & Bind Policy
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

