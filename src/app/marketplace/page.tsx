'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Shield, Star, TrendingUp, Lock, CheckCircle2, ArrowLeft, Shuffle, Info, Eye } from 'lucide-react'
import { EntropyDebugPanel } from '@/app/components/EntropyDebugPanel'

interface Underwriter {
  id: string
  name: string
  avatar: string
  reputation: number // Out of 5
  totalPoliciesUnderwritten: number
  activePolicies: number
  premiumMultiplier: number // e.g., 1.1 = base * 1.1
  coverageLimit: number
  collateralLocked: number
  specialties: string[]
  responseTime: string
  claimApprovalRate: number // Percentage
}

// Mock underwriter data
const mockUnderwriters: Underwriter[] = [
  {
    id: 'uw-001',
    name: 'Sarah Chen',
    avatar: '👩‍💼',
    reputation: 4.9,
    totalPoliciesUnderwritten: 142,
    activePolicies: 23,
    premiumMultiplier: 1.05,
    coverageLimit: 500000,
    collateralLocked: 125000,
    specialties: ['Health', 'Life', 'Travel'],
    responseTime: '< 2 hours',
    claimApprovalRate: 96
  },
  {
    id: 'uw-002',
    name: 'Marcus Rodriguez',
    avatar: '👨‍💼',
    reputation: 4.8,
    totalPoliciesUnderwritten: 98,
    activePolicies: 18,
    premiumMultiplier: 1.08,
    coverageLimit: 400000,
    collateralLocked: 100000,
    specialties: ['Auto', 'Home', 'Life'],
    responseTime: '< 3 hours',
    claimApprovalRate: 94
  },
  {
    id: 'uw-003',
    name: 'Aisha Patel',
    avatar: '👩‍⚕️',
    reputation: 4.95,
    totalPoliciesUnderwritten: 187,
    activePolicies: 31,
    premiumMultiplier: 1.03,
    coverageLimit: 750000,
    collateralLocked: 200000,
    specialties: ['Health', 'Disability', 'Life'],
    responseTime: '< 1 hour',
    claimApprovalRate: 98
  },
  {
    id: 'uw-004',
    name: 'James Walker',
    avatar: '🧑‍💼',
    reputation: 4.7,
    totalPoliciesUnderwritten: 76,
    activePolicies: 15,
    premiumMultiplier: 1.12,
    coverageLimit: 350000,
    collateralLocked: 85000,
    specialties: ['Business', 'Auto', 'Pet'],
    responseTime: '< 4 hours',
    claimApprovalRate: 92
  },
  {
    id: 'uw-005',
    name: 'Nina Kowalski',
    avatar: '👩‍🔬',
    reputation: 4.85,
    totalPoliciesUnderwritten: 121,
    activePolicies: 22,
    premiumMultiplier: 1.06,
    coverageLimit: 600000,
    collateralLocked: 150000,
    specialties: ['Travel', 'Health', 'Home'],
    responseTime: '< 2 hours',
    claimApprovalRate: 95
  }
]

export default function MarketplacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedUnderwriter, setSelectedUnderwriter] = useState<string | null>(null)
  const [isBinding, setIsBinding] = useState(false)
  const [matchedUnderwriters, setMatchedUnderwriters] = useState<Underwriter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fairnessProof, setFairnessProof] = useState<{
    randomSeed: string;
    timestamp: number;
    requestId: string;
    entropySource: string;
    method: string;
    guarantee: string;
  } | null>(null)
  const [showFairnessInfo, setShowFairnessInfo] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [verificationData, setVerificationData] = useState<{
    originalOrder: string[];
    shuffledOrder: string[];
  } | null>(null)
  
  // Get quote data from URL params
  const insuranceType = searchParams.get('type') || 'Health'
  const basePremium = parseFloat(searchParams.get('premium') || '150')
  const userName = searchParams.get('name') || 'User'

  // Fetch fairly ordered underwriters using Pyth Entropy
  useEffect(() => {
    const fetchFairUnderwriters = async () => {
      setIsLoading(true)
      try {
        console.log('🎲 Fetching fair underwriter ordering...')
        
        // Call our fair matching API with Pyth Entropy
        const response = await fetch(
          `/api/underwriters/fair-match?type=${encodeURIComponent(insuranceType)}&debug=true`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch underwriters')
        }

        const data = await response.json()
        
        console.log('✅ Fair underwriters received:', data)
        console.log('📊 Fairness Proof:', data.fairnessProof)
        console.log('🔐 Random Seed:', data.fairnessProof?.randomSeed?.substring(0, 16) + '...')
        
        setMatchedUnderwriters(data.underwriters)
        setFairnessProof(data.fairnessProof)
        setVerificationData(data.verification)
        
      } catch (error) {
        console.error('❌ Error fetching fair underwriters:', error)
        // Fallback to mock data
        setMatchedUnderwriters(mockUnderwriters.slice(0, 5))
      } finally {
        setIsLoading(false)
      }
    }

    fetchFairUnderwriters()
  }, [insuranceType])

  const handleSelectUnderwriter = (underwriterId: string) => {
    setSelectedUnderwriter(underwriterId)
  }

  const handleBindContract = () => {
    if (!selectedUnderwriter) {
      alert('Please select an underwriter first')
      return
    }

    setIsBinding(true)
    
    // Simulate blockchain transaction
    setTimeout(() => {
      alert('✅ Contract successfully bound on blockchain!\n\n' +
            'Your policy is now active.\n' +
            'Collateral has been locked.\n' +
            'Policy NFT minted to your wallet.')
      setIsBinding(false)
      router.push('/')
    }, 3000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateFinalPremium = (multiplier: number) => {
    return basePremium * multiplier
  }

  return (
    <div className="geometric-bg min-h-screen flex flex-col items-center justify-start px-6 py-12 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 border-2 border-teal/10 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-40 right-20 w-32 h-32 border-2 border-coral/10 rounded-lg rotate-45 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      
      <div className="max-w-6xl w-full z-10">
        {/* Header Section */}
        <header className="text-center mb-12 opacity-0 animate-slide-up">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              size="sm"
              className="absolute left-0 top-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 
              className="text-6xl font-bold tracking-tight"
              style={{ 
                fontFamily: "'Crimson Text', serif",
                color: 'var(--navy)',
                letterSpacing: '-0.02em'
              }}
            >
              Matched Underwriters
            </h1>
          </div>
          <p 
            className="text-lg text-gray-600 font-light tracking-wide mb-2"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {isLoading ? 'Finding fair matches...' : `We found ${matchedUnderwriters.length} underwriters for your ${insuranceType}`}
          </p>
          <p className="text-sm text-gray-500">
            Select the underwriter that best fits your needs
          </p>
        </header>

        {/* Pyth Entropy Fairness Banner */}
        {fairnessProof && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border-2 border-purple-200 opacity-0 animate-fade-in delay-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <Shuffle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-purple-900">
                    🎲 Fair Matching Powered by Pyth Entropy
                  </h3>
                  <p className="text-xs text-purple-700">
                    Underwriters randomized for unbiased, equal exposure
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFairnessInfo(!showFairnessInfo)}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <Info className="w-4 h-4 mr-2" />
                {showFairnessInfo ? 'Hide' : 'Show'} Proof
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugPanel(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Eye className="w-4 h-4 mr-2" />
                Debug Panel
              </Button>
            </div>
            
            {/* Fairness Proof Details */}
            {showFairnessInfo && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-purple-900 mb-1">Random Seed:</p>
                    <p className="font-mono text-purple-700 break-all">
                      {fairnessProof.randomSeed?.substring(0, 32)}...
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900 mb-1">Request ID:</p>
                    <p className="font-mono text-purple-700 break-all">
                      {fairnessProof.requestId}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900 mb-1">Entropy Source:</p>
                    <p className="text-purple-700">{fairnessProof.entropySource}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900 mb-1">Timestamp:</p>
                    <p className="text-purple-700">
                      {new Date(fairnessProof.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-purple-100 rounded-lg">
                  <p className="text-xs text-purple-800">
                    <strong>Fairness Guarantee:</strong> {fairnessProof.guarantee}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    <strong>Method:</strong> {fairnessProof.method}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quote Summary Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-teal/20 mb-8 opacity-0 animate-fade-in delay-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Base Quote</p>
              <p className="text-3xl font-bold text-navy" style={{ fontFamily: "'Crimson Text', serif" }}>
                {formatCurrency(basePremium)} <span className="text-base text-gray-500">/month</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Policy Holder</p>
              <p className="text-lg font-semibold text-teal">{userName}</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-teal border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg text-gray-600 font-semibold">
              🎲 Shuffling underwriters with Pyth Entropy...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Ensuring fair, unbiased ordering
            </p>
          </div>
        )}

        {/* Underwriters Grid */}
        {!isLoading && (
          <div className="space-y-4 mb-8">
            {matchedUnderwriters.map((underwriter, index) => {
            const finalPremium = calculateFinalPremium(underwriter.premiumMultiplier)
            const isSelected = selectedUnderwriter === underwriter.id
            
            return (
              <div
                key={underwriter.id}
                className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 cursor-pointer opacity-0 animate-scale-in ${
                  isSelected 
                    ? 'border-teal shadow-2xl scale-105' 
                    : 'border-gray-200 hover:border-teal/50 hover:shadow-xl'
                }`}
                style={{ animationDelay: `${index * 100 + 200}ms` }}
                onClick={() => handleSelectUnderwriter(underwriter.id)}
              >
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal/20 to-coral/20 flex items-center justify-center text-4xl border-2 border-white shadow-lg">
                      {underwriter.avatar}
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 
                          className="text-2xl font-bold text-navy mb-1"
                          style={{ fontFamily: "'Crimson Text', serif" }}
                        >
                          {underwriter.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{underwriter.reputation}</span>
                            <span className="text-gray-400">({underwriter.totalPoliciesUnderwritten} policies)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4 text-teal" />
                            <span>{underwriter.activePolicies} active</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Premium Display */}
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Your Premium</p>
                        <p className="text-3xl font-bold text-coral" style={{ fontFamily: "'Crimson Text', serif" }}>
                          {formatCurrency(finalPremium)}
                        </p>
                        <p className="text-xs text-gray-500">
                          (Base × {underwriter.premiumMultiplier})
                        </p>
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="flex gap-2 mb-3">
                      {underwriter.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-3 py-1 bg-teal/10 text-teal text-xs font-semibold rounded-full border border-teal/20"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Coverage Limit</p>
                        <p className="text-sm font-bold text-navy">{formatCurrency(underwriter.coverageLimit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Collateral Locked</p>
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-teal" />
                          <p className="text-sm font-bold text-teal">{formatCurrency(underwriter.collateralLocked)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Response Time</p>
                        <p className="text-sm font-bold text-navy">{underwriter.responseTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Claim Approval</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <p className="text-sm font-bold text-green-600">{underwriter.claimApprovalRate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-teal flex items-center justify-center animate-scale-in">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
            })}
          </div>
        )}

        {/* Action Section */}
        {selectedUnderwriter && (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-teal animate-scale-in">
            <div className="text-center mb-6">
              <h3 
                className="text-2xl font-bold text-navy mb-2"
                style={{ fontFamily: "'Crimson Text', serif" }}
              >
                Ready to Bind Contract?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Your selected underwriter: <span className="font-bold text-teal">
                  {matchedUnderwriters.find(u => u.id === selectedUnderwriter)?.name}
                </span>
              </p>
            </div>

            <div className="bg-teal/5 rounded-lg p-4 mb-6 border border-teal/20">
              <h4 className="text-sm font-bold text-navy mb-3">What happens next:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                  <span>Smart contract locks underwriter&apos;s collateral on blockchain</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                  <span>Your premium payment is secured in escrow</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                  <span>Policy NFT is minted to your wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                  <span>Coverage becomes active immediately</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setSelectedUnderwriter(null)}
                variant="outline"
                size="lg"
                className="font-semibold tracking-wide text-base px-10 border-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
                disabled={isBinding}
              >
                Change Selection
              </Button>
              <Button
                onClick={handleBindContract}
                size="lg"
                className="font-semibold tracking-wide text-base px-10"
                style={{ 
                  backgroundColor: 'var(--coral)',
                  fontFamily: "'Outfit', sans-serif"
                }}
                disabled={isBinding}
              >
                {isBinding ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Binding Contract...
                  </span>
                ) : (
                  'Bind Contract on Blockchain'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Info Banner */}
        {!isLoading && (
          <div className="mt-8 text-center opacity-0 animate-fade-in delay-400">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 font-light mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal" />
                <span>Smart contracts on Flare Network</span>
              </div>
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-purple-600" />
                <span>Fair ordering via Pyth Entropy</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Verifiable randomness ensures no bias, gaming, or preferential treatment
            </p>
          </div>
        )}
      </div>

      {/* Debug Panel */}
      <EntropyDebugPanel
        show={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
        fairnessProof={fairnessProof || undefined}
        underwriters={matchedUnderwriters}
        originalOrder={verificationData?.originalOrder}
        shuffledOrder={verificationData?.shuffledOrder}
      />
    </div>
  )
}

