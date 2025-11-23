'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ISuccessResult } from '@worldcoin/idkit'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Select } from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import { FileUpload } from '@/app/components/ui/fileupload'
import { EntropyDebugPanel } from '@/app/components/EntropyDebugPanel'
import { Shield, Heart, Users, Loader2, CheckCircle2, Wallet, Globe, Shuffle, Star, ArrowLeft, Eye } from 'lucide-react'

// Dynamically import WorldIDVerification to avoid SSR issues
const WorldIDVerification = dynamic(
  () => import('@/app/components/WorldIDVerification'),
  { ssr: false }
)

interface ProgressStage {
  stage: number
  message: string
  progress: number
}

interface FormData {
  firstName: string
  lastName: string
  age: string
  nationality: string
  insuranceType: string
  driversLicense: File | null
  passport: File | null
  additionalInfo: string
}

interface Underwriter {
  id: string
  name: string
  avatar: string
  reputation: number
  totalPoliciesUnderwritten: number
  activePolicies: number
  premiumMultiplier: number
  coverageLimit: number
  collateralLocked: number
  specialties: string[]
  responseTime: string
  claimApprovalRate: number
}

interface FairnessProof {
  randomSeed: string
  timestamp: number
  requestId: string
  entropySource: string
  method: string
  guarantee: string
}

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    age: '',
    nationality: '',
    insuranceType: '',
    driversLicense: null,
    passport: null,
    additionalInfo: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [currentStage, setCurrentStage] = useState<ProgressStage>({ stage: 0, message: '', progress: 0 })
  const [apiResult, setApiResult] = useState('')
  
  // World ID & Wallet State
  const [isWorldIDVerified, setIsWorldIDVerified] = useState(false)
  const [worldIDData, setWorldIDData] = useState<ISuccessResult | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  
  // Split View State
  const [showSplitView, setShowSplitView] = useState(false)
  const [matchedUnderwriters, setMatchedUnderwriters] = useState<Underwriter[]>([])
  const [selectedUnderwriter, setSelectedUnderwriter] = useState<string | null>(null)
  const [fairnessProof, setFairnessProof] = useState<FairnessProof | null>(null)
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  // Scroll to top when split view appears
  useEffect(() => {
    if (showSplitView) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [showSplitView])

  // API call with progress updates
  const callBackend = async () => {
    const stages = [
      { stage: 1, message: `Analyzing ${formData.insuranceType} requirements for ${formData.firstName}...`, progress: 25, delay: 3000 },
      { stage: 2, message: 'Generating your AI-powered insurance quote...', progress: 50, delay: 3000 },
      { stage: 3, message: 'Finding matched peer-to-peer underwriters...', progress: 75, delay: 3000 },
      { stage: 4, message: 'Preparing your personalized options...', progress: 100, delay: 2000 }
    ]

    for (const stage of stages) {
      setCurrentStage(stage)
      await new Promise(resolve => setTimeout(resolve, stage.delay))
    }

    // Call the AI API for quote generation
    try {
      // Construct a detailed prompt with all form data for insurance quote generation
      const comprehensivePrompt = `Generate a CONCISE, professional insurance quote for:

CLIENT: ${formData.firstName} ${formData.lastName}, Age ${formData.age}, ${formData.nationality}
INSURANCE TYPE: ${formData.insuranceType}
${formData.additionalInfo ? `NOTES: ${formData.additionalInfo}` : ''}

FORMAT REQUIREMENTS (IMPORTANT - Keep it SHORT and SCANNABLE):

1. Start with: "Hello ${formData.firstName}," (personalized greeting)

2. Brief intro (1-2 sentences max) thanking them for choosing Ensura

3. COVERAGE RECOMMENDATION (3-4 bullet points):
   • Policy type and coverage amount
   • Term/duration
   • Key benefit highlights
   
4. PRICING (clear and prominent):
   • Monthly premium: $XX
   • Annual premium: $XXX
   • Total coverage: $XXX,XXX
   
5. WHY THIS WORKS FOR YOU (2-3 bullets based on age ${formData.age}, ${formData.nationality}):
   • Age advantage / risk profile
   • Coverage fit for life stage
   
6. IMPORTANT TO KNOW (2-3 key exclusions only):
   • Most critical exclusion
   • One other important note
   
7. NEXT STEPS (3 simple steps):
   • Step 1: Review and accept
   • Step 2: Complete verification  
   • Step 3: Coverage activates

Keep the TOTAL response under 300 words. Use clear sections. Be professional but warm. This is for blockchain-based insurance on Flare Network - mention the transparency/smart contract benefit once briefly.

Make it look like a modern, executive summary style quote - not a lengthy contract.`.trim()

      console.log('📤 Sending quote request to AI with client data:', {
        name: `${formData.firstName} ${formData.lastName}`,
        age: formData.age,
        insuranceType: formData.insuranceType,
        nationality: formData.nationality
      })

      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerAddress: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
          prompt: comprehensivePrompt,
          systemPromptType: "policyAdvisor",  // Use specialized insurance advisor prompt
          responseFormat: "default",  // Get detailed response, not concise
          temperature: 0.7,  // Balanced creativity and accuracy
          maxTokens: 2000  // Allow for detailed quote
        })
      })
      
      console.log('📥 Received response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        let errorMessage = 'Failed to generate quote. Please try again.'
        
        if (errorData?.code === 'INSUFFICIENT_BALANCE') {
          errorMessage = '⚠️ Service temporarily unavailable. Please contact support or try again later.\n\nTechnical details: Insufficient blockchain credits.'
          console.error('❌ Insufficient balance for AI provider')
        } else if (errorData?.code === 'PROVIDER_NOT_ACKNOWLEDGED') {
          errorMessage = '⚠️ Service initialization in progress. Please try again in a moment.'
          console.error('❌ Provider not acknowledged')
        } else if (errorData?.message) {
          errorMessage = `Error: ${errorData.message}`
          console.error('❌ API Error:', errorData.message)
        } else {
          console.error('❌ API Error: Request failed with status', response.status)
        }
        
        setApiResult(errorMessage)
      } else {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          console.log('✅ Quote generated successfully')
          
          // Extract the actual quote content
          const quoteContent = data.response || data.content || JSON.stringify(data, null, 2)
          
          setApiResult(quoteContent)
        } else {
          const text = await response.text()
          console.warn('⚠️ Received non-JSON response')
          setApiResult(`Received non-JSON response:\n${text}`)
        }
      }
    } catch (error) {
      console.error('❌ Request Error:', error)
      setApiResult('Network error: Unable to connect to the service. Please check your connection and try again.\n\nError details: ' + (error as Error).message)
    }

    // Fetch underwriters in parallel
    try {
      console.log('🎲 Fetching fair underwriter ordering...')
      
      const response = await fetch(
        `/api/underwriters/fair-match?type=${encodeURIComponent(formData.insuranceType)}&debug=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMatchedUnderwriters(data.underwriters)
        setFairnessProof(data.fairnessProof)
        console.log('✅ Fair underwriters received:', data.underwriters.length, 'matches')
      }
    } catch (error) {
      console.error('❌ Error fetching underwriters:', error)
    }

    setIsLoading(false)
    setShowSplitView(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.age || 
        !formData.nationality || !formData.insuranceType) {
      alert('Please fill in all required fields')
      return
    }
    
    setIsLoading(true)
    callBackend()
  }

  const handleInputChange = (field: keyof FormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDeclineContract = () => {
    const confirmed = confirm('Are you sure you want to start over? You can submit a new request anytime.')
    if (confirmed) {
      // Reset to initial state
      setShowSplitView(false)
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        nationality: '',
        insuranceType: '',
        driversLicense: null,
        passport: null,
        additionalInfo: ''
      })
      setCurrentStage({ stage: 0, message: '', progress: 0 })
      setApiResult('')
      setMatchedUnderwriters([])
      setSelectedUnderwriter(null)
      setFairnessProof(null)
    }
  }

  // World ID Verification Handler
  const handleWorldIDSuccess = (result: ISuccessResult) => {
    console.log('✅ World ID Verification successful:', result)
    setWorldIDData(result)
    setIsWorldIDVerified(true)
  }

  const handleWorldIDError = (error: Error) => {
    console.error('❌ World ID Verification failed:', error)
    alert('World ID verification failed. Please try again.')
  }

  // Dev only: Skip World ID verification
  const handleSkipWorldID = () => {
    console.log('🔧 DEV MODE: Skipping World ID verification')
    setWorldIDData({
      merkle_root: 'dev_mock_root',
      nullifier_hash: 'dev_mock_nullifier',
      proof: 'dev_mock_proof',
      verification_level: 'device'
    } as ISuccessResult)
    setIsWorldIDVerified(true)
  }

  // Wallet Connection Handler
  const handleConnectWallet = async () => {
    setIsConnectingWallet(true)
    
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        }) as string[]
        
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0])
          console.log('✅ Wallet connected:', accounts[0])
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet to continue.\n\nFor demo purposes, we\'ll simulate a wallet connection.')
        // For demo: generate a mock wallet address
        const mockWallet = '0x' + Math.random().toString(16).substring(2, 42)
        setWalletAddress(mockWallet)
        console.log('🔧 Demo wallet address:', mockWallet)
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      alert('Failed to connect wallet. Please try again.')
    } finally {
      setIsConnectingWallet(false)
    }
  }

  return (
    <div className="geometric-bg min-h-screen flex flex-col items-center justify-start px-6 py-12 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 border-2 border-teal/10 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-40 right-20 w-32 h-32 border-2 border-coral/10 rounded-lg rotate-45 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-teal/10 animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      
      <div className="max-w-4xl w-full z-10">
        {/* Header Section */}
        <header className="text-center mb-16 opacity-0 animate-slide-up">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => router.push('/become-insurer')}
              variant="outline"
              size="sm"
              className="font-medium"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Become an Insurer →
            </Button>
          </div>
          <h1 
            className="text-8xl font-bold mb-4 tracking-tight"
            style={{ 
              fontFamily: "'Crimson Text', serif",
              color: 'var(--navy)',
              letterSpacing: '-0.02em'
            }}
          >
            Ensura
          </h1>
          <p 
            className="text-xl text-gray-600 font-light tracking-wide"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            You are safe with us
          </p>
        </header>

        {/* World ID Verification Section */}
        {!isWorldIDVerified && !isLoading && !showSplitView && (
          <div className="space-y-6 opacity-0 animate-scale-in delay-300">
            <div className="relative">
              {/* Decorative corner elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-teal/30" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-coral/30" />
              
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-2xl border border-teal/10 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal/20 to-coral/20 flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-lg">
                    <Globe className="w-10 h-10 text-teal" />
                  </div>
                  <h2 
                    className="text-4xl font-bold text-navy mb-4"
                    style={{ fontFamily: "'Crimson Text', serif" }}
                  >
                    Verify Your Identity
                  </h2>
                  <p 
                    className="text-lg text-gray-600 mb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Proof of Personhood Required
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    To ensure fair and unbiased insurance, we verify that you&apos;re a unique human using World ID - without revealing any personal information.
                  </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-teal/5 rounded-lg p-4 border border-teal/20 text-center">
                    <Shield className="w-6 h-6 text-teal mx-auto mb-2" />
                    <p className="text-xs font-semibold text-navy mb-1">Privacy First</p>
                    <p className="text-xs text-gray-600">No personal data shared</p>
                  </div>
                  <div className="bg-teal/5 rounded-lg p-4 border border-teal/20 text-center">
                    <CheckCircle2 className="w-6 h-6 text-teal mx-auto mb-2" />
                    <p className="text-xs font-semibold text-navy mb-1">One Person, One Policy</p>
                    <p className="text-xs text-gray-600">Prevents fraud & abuse</p>
                  </div>
                  <div className="bg-teal/5 rounded-lg p-4 border border-teal/20 text-center">
                    <Heart className="w-6 h-6 text-teal mx-auto mb-2" />
                    <p className="text-xs font-semibold text-navy mb-1">Fair Pricing</p>
                    <p className="text-xs text-gray-600">AI-driven, unbiased quotes</p>
                  </div>
                </div>

                {/* World ID Button */}
                <div className="mb-6">
                  <WorldIDVerification 
                    onSuccess={handleWorldIDSuccess}
                    onError={handleWorldIDError}
                  />
                </div>

                {/* Dev Mode: Skip Button */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-center">
                    <Button
                      onClick={handleSkipWorldID}
                      variant="outline"
                      size="sm"
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Skip (Dev Only)
                    </Button>
                  </div>
                )}

                {/* Info Text */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong className="text-navy">What is World ID?</strong><br />
                    World ID is a privacy-preserving proof of personhood protocol. It proves you&apos;re a unique human without revealing your identity. Verification levels include Device (phone), Document (passport), or Orb (biometric).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Connection Section */}
        {isWorldIDVerified && !walletAddress && !isLoading && !showSplitView && (
          <div className="space-y-6 opacity-0 animate-scale-in delay-300">
            <div className="relative">
              {/* Decorative corner elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-teal/30" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-coral/30" />
              
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-2xl border border-teal/10 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal/20 to-coral/20 flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-lg">
                    <Wallet className="w-10 h-10 text-coral" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <h2 
                      className="text-4xl font-bold text-navy"
                      style={{ fontFamily: "'Crimson Text', serif" }}
                    >
                      Identity Verified
                    </h2>
                  </div>
                  <p 
                    className="text-lg text-gray-600 mb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Connect Your Wallet
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Connect your wallet to receive your policy NFT and manage your insurance on-chain.
                  </p>
                </div>

                {/* Verification Details */}
                {worldIDData && (
                  <div className="bg-teal/5 rounded-lg p-4 mb-6 border border-teal/20">
                    <p className="text-xs font-semibold text-teal mb-2 uppercase tracking-wide">Verification Details</p>
                    <div className="space-y-1 text-xs text-gray-700">
                      <p><span className="font-medium">Level:</span> {worldIDData.verification_level}</p>
                      <p><span className="font-medium">Status:</span> <span className="text-green-600 font-semibold">✓ Verified</span></p>
                    </div>
                  </div>
                )}

                {/* Connect Wallet Button */}
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnectingWallet}
                  size="lg"
                  className="w-full font-semibold tracking-wide text-base py-6"
                  style={{ 
                    backgroundColor: 'var(--coral)',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                >
                  {isConnectingWallet ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Supports MetaMask, WalletConnect, and other Web3 wallets
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Section */}
        {isWorldIDVerified && walletAddress && !isLoading && !showSplitView && (
          <form onSubmit={handleSubmit} className="space-y-6 opacity-0 animate-scale-in delay-300">
            <div className="relative">
              {/* Decorative corner elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-teal/30" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-coral/30" />
              
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-teal/10">
                {/* Verification Status Banner */}
                <div className="bg-gradient-to-r from-teal/10 to-coral/10 rounded-lg p-4 mb-6 border border-teal/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-navy">Verified Human</p>
                        <p className="text-xs text-gray-600">{worldIDData?.verification_level} Level</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-coral flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-navy">Wallet Connected</p>
                        <p className="text-xs text-gray-600 font-mono">
                          {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <h2 
                  className="text-2xl font-bold text-navy mb-6"
                  style={{ fontFamily: "'Crimson Text', serif" }}
                >
                  Insurance Application
                </h2>

                {/* Personal Information Section */}
                <div className="mb-8">
                  <h3 
                    className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase"
                    style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                  >
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label 
                        htmlFor="firstName" 
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        First Name <span className="text-coral">*</span>
                      </label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label 
                        htmlFor="lastName" 
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Last Name <span className="text-coral">*</span>
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label 
                        htmlFor="age" 
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Age <span className="text-coral">*</span>
                      </label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="30"
                        min="18"
                        max="120"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label 
                        htmlFor="nationality" 
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Nationality <span className="text-coral">*</span>
                      </label>
                      <Select
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        required
                      >
                        <option value="">Select nationality...</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Spain">Spain</option>
                        <option value="Italy">Italy</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Japan">Japan</option>
                        <option value="China">China</option>
                        <option value="India">India</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Other">Other</option>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Insurance Type Section */}
                <div className="mb-8">
                  <h3 
                    className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase"
                    style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                  >
                    Insurance Details
                  </h3>
                  <div>
                    <label 
                      htmlFor="insuranceType" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Type of Insurance <span className="text-coral">*</span>
                    </label>
                    <Select
                      id="insuranceType"
                      value={formData.insuranceType}
                      onChange={(e) => handleInputChange('insuranceType', e.target.value)}
                      required
                    >
                      <option value="">Select insurance type...</option>
                      <option value="Health Insurance">Health Insurance</option>
                      <option value="Life Insurance">Life Insurance</option>
                      <option value="Auto Insurance">Auto Insurance</option>
                      <option value="Home Insurance">Home Insurance</option>
                      <option value="Travel Insurance">Travel Insurance</option>
                      <option value="Business Insurance">Business Insurance</option>
                      <option value="Disability Insurance">Disability Insurance</option>
                      <option value="Pet Insurance">Pet Insurance</option>
                    </Select>
                  </div>
                </div>

                {/* Document Upload Section */}
                <div className="mb-8">
                  <h3 
                    className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase"
                    style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                  >
                    Document Uploads
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label 
                        htmlFor="driversLicense" 
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Driver&apos;s License (Optional)
                      </label>
                      <FileUpload
                        id="driversLicense"
                        label="Upload driver's license..."
                        accept="image/*,.pdf"
                        onChange={(file) => handleInputChange('driversLicense', file)}
                      />
                    </div>
                    <div>
                      <label 
                        htmlFor="passport" 
                        className="block text-sm font-medium text-gray-700 mb-2"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Passport (Optional)
                      </label>
                      <FileUpload
                        id="passport"
                        label="Upload passport..."
                        accept="image/*,.pdf"
                        onChange={(file) => handleInputChange('passport', file)}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="mb-6">
                  <h3 
                    className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase"
                    style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                  >
                    Additional Information
                  </h3>
                  <label 
                    htmlFor="additionalInfo" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Tell us more about your insurance needs
                  </label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Share any specific concerns, medical conditions, coverage preferences, or questions you have. This helps us provide you with the most accurate quote..."
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    type="submit"
                    size="lg"
                    className="font-semibold tracking-wide text-base px-12"
                    style={{ 
                      backgroundColor: 'var(--coral)',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  >
                    Get Your Quote
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {isLoading && (
          // Loading View with Video
          <div className="space-y-6 animate-scale-in">
            <div className="relative">
              {/* Decorative corner elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-teal/30 z-10" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-coral/30 z-10" />
              
              <div className="bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-teal/10">
                <div className="grid grid-cols-2 gap-0">
                  {/* Progress Section - Left */}
                  <div className="p-12 bg-white/90 flex flex-col justify-center">
                    <div className="space-y-8">
                      {/* Progress Bar */}
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">
                          Processing Your Request
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000 ease-out"
                            style={{ width: `${currentStage.progress}%`, backgroundColor: 'var(--teal)' }}
                          />
                        </div>
                      </div>

                      {/* Application Summary */}
                      <div className="bg-teal/5 rounded-lg p-4 border border-teal/10">
                        <p className="text-xs font-semibold text-teal mb-2 uppercase tracking-wider">
                          Your Application
                        </p>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p><span className="font-medium">Applicant:</span> {formData.firstName} {formData.lastName}</p>
                          <p><span className="font-medium">Coverage:</span> {formData.insuranceType}</p>
                          <p><span className="font-medium">Age:</span> {formData.age} | <span className="font-medium">Nationality:</span> {formData.nationality}</p>
                          {(formData.driversLicense || formData.passport) && (
                            <p className="text-xs text-teal mt-2">
                              ✓ {[formData.driversLicense && "License", formData.passport && "Passport"].filter(Boolean).join(', ')} uploaded
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Three Stage Indicators */}
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((stage) => (
                          <div 
                            key={stage}
                            className="flex items-center gap-4"
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                              currentStage.stage >= stage 
                                ? 'bg-teal text-white scale-110' 
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              {currentStage.stage > stage ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : currentStage.stage === stage ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                              ) : (
                                <span className="text-lg font-bold">{stage}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-semibold transition-colors duration-300 ${
                                currentStage.stage >= stage ? 'text-teal' : 'text-gray-400'
                              }`}>
                                Stage {stage}
                              </p>
                              {currentStage.stage === stage && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {currentStage.message}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Current Status Message */}
                      <div className="pt-4 border-t border-gray-200">
                        <p 
                          className="text-base text-gray-700 font-medium animate-pulse"
                          style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                          {currentStage.message}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Please wait while we process your information...
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Video Section - Right */}
                  <div className="relative bg-black flex items-center justify-center min-h-[500px]">
                    <video
                      className="w-full h-full object-cover absolute inset-0"
                      autoPlay
                      loop
                      muted
                      playsInline
                      key="loading-video"
                    >
                      <source src="/loading-video.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Split View - Company Insurance vs Peer-to-Peer */}
        {showSplitView && (
          <div className="space-y-6 animate-scale-in">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 
                className="text-5xl font-bold text-navy mb-4"
                style={{ fontFamily: "'Crimson Text', serif" }}
              >
                Choose Your Insurance Path
              </h2>
              <p className="text-lg text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Select between our AI-powered agency insurance or connect directly with peer underwriters
              </p>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-2 gap-6 min-h-[800px]">
              {/* LEFT SIDE - Company Insurance (LLM Generated) */}
              <div className="relative">
                <div className="sticky top-6">
                  <div className="bg-gradient-to-br from-teal/10 to-teal/5 rounded-2xl p-8 shadow-2xl border-2 border-teal/30 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 
                          className="text-3xl font-bold text-navy mb-2"
                          style={{ fontFamily: "'Crimson Text', serif" }}
                        >
                          Agency Insurance
                        </h3>
                        <p className="text-sm text-gray-600">AI-Powered by Ensura</p>
                      </div>
                      <div className="w-16 h-16 rounded-full bg-teal/20 flex items-center justify-center border-2 border-teal">
                        <Shield className="w-8 h-8 text-teal" />
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-white/80 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-teal">Instant</div>
                        <div className="text-xs text-gray-600">Approval</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-teal">24/7</div>
                        <div className="text-xs text-gray-600">Support</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 text-center flex flex-col items-center justify-center">
                        <div className="text-xs text-gray-600 mb-1">Powered by</div>
                        <Image 
                          src="/logo.webp" 
                          alt="0G" 
                          width={64}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                    </div>

                    {/* Contract Preview */}
                    <div className="bg-white/90 rounded-xl p-6 mb-6 max-h-[400px] overflow-y-auto shadow-inner border border-gray-200">
                      <h4 className="text-sm font-bold text-navy mb-4 uppercase tracking-wide">Your Quote</h4>
                      <div 
                        className="text-sm text-gray-800 leading-relaxed space-y-3"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                        dangerouslySetInnerHTML={{ 
                          __html: apiResult
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-navy font-bold">$1</strong>')
                            .replace(/^(Hello.*?)$/gm, '<p class="text-lg font-semibold text-teal mb-3">$1</p>')
                            .replace(/^(Dear.*?)$/gm, '<p class="text-lg font-semibold text-teal mb-3">$1</p>')
                            .replace(/\$(\d{1,3}(,\d{3})*(\.\d{2})?)/g, '<span class="text-coral font-bold text-base">$$$1</span>')
                            .replace(/^(COVERAGE RECOMMENDATION|PRICING|WHY THIS WORKS|IMPORTANT TO KNOW|NEXT STEPS|Coverage|Pricing|Next Steps):/gm, '<h5 class="text-xs font-bold text-navy mt-4 mb-2 uppercase tracking-wide">$1:</h5>')
                            .replace(/^•\s/gm, '<span class="text-teal">•</span> ')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>

                    {/* Benefits */}
                    <div className="bg-teal/10 rounded-lg p-4 mb-6 border border-teal/20">
                      <h4 className="text-xs font-bold text-navy mb-3 uppercase tracking-wide">Why Choose Agency Insurance?</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                          <span>Instant approval with no waiting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                          <span>Backed by Ensura&apos;s capital reserves</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                          <span>AI-optimized pricing and coverage</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                          <span>Simplified claims process</span>
                        </li>
                      </ul>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => {
                        alert('✅ Agency Insurance Selected!\n\nYour policy would be bound to the blockchain.\nThis is a demo - blockchain integration coming soon.')
                      }}
                      size="lg"
                      className="w-full font-semibold tracking-wide text-base py-6"
                      style={{ 
                        backgroundColor: 'var(--teal)',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                    >
                      Select Agency Insurance
                    </Button>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE - Peer-to-Peer Marketplace */}
              <div className="bg-gradient-to-br from-coral/10 to-coral/5 rounded-2xl p-8 shadow-2xl border-2 border-coral/30 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 
                      className="text-3xl font-bold text-navy mb-2"
                      style={{ fontFamily: "'Crimson Text', serif" }}
                    >
                      Peer-to-Peer
                    </h3>
                    <p className="text-sm text-gray-600">Connect with Underwriters</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-coral/20 flex items-center justify-center border-2 border-coral">
                    <Users className="w-8 h-8 text-coral" />
                  </div>
                </div>

                {/* Fairness Badge */}
                {fairnessProof && (
                  <div className="bg-purple-50 rounded-lg p-3 mb-6 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-purple-600" />
                        <p className="text-xs font-semibold text-purple-900">
                          Fair Matching via Pyth Entropy
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDebugPanel(true)}
                        className="border-purple-300 text-purple-700 hover:bg-purple-100 text-xs py-1 px-2 h-auto"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Debug
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {matchedUnderwriters.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm text-gray-600">Finding matched underwriters...</p>
                  </div>
                )}

                {/* Underwriters List */}
                {matchedUnderwriters.length > 0 && (
                  <div className="space-y-3 mb-6 max-h-[550px] overflow-y-auto pr-2">
                    {matchedUnderwriters.map((underwriter: Underwriter) => {
                      const premiumMatch = apiResult.match(/\$(\d+(?:,\d+)*(?:\.\d{2})?)/);
                      const basePremium = premiumMatch ? parseFloat(premiumMatch[1].replace(/,/g, '')) : 150;
                      const finalPremium = basePremium * underwriter.premiumMultiplier;
                      const isSelected = selectedUnderwriter === underwriter.id;
                      const isSBF = underwriter.id === 'uw-999'; // Meme entry
                      
                      return (
                        <div
                          key={underwriter.id}
                          className={`bg-white/90 rounded-xl p-4 shadow-md border-2 transition-all duration-200 cursor-pointer ${
                            isSBF 
                              ? 'border-red-500 bg-red-50/50' 
                              : isSelected 
                                ? 'border-coral scale-105' 
                                : 'border-gray-200 hover:border-coral/50'
                          }`}
                          onClick={() => setSelectedUnderwriter(underwriter.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Image
                              src={underwriter.avatar}
                              alt={underwriter.name}
                              width={48}
                              height={48}
                              className="rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              {/* Header with Name and Badge */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="text-base font-bold text-navy">
                                      {underwriter.name}
                                    </h4>
                                    {isSBF && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">🚨 SCAM</span>}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Star className={`w-3 h-3 flex-shrink-0 ${isSBF ? 'text-red-500 fill-red-500' : 'text-yellow-500 fill-yellow-500'}`} />
                                    <span className={isSBF ? 'text-red-600 font-bold' : ''}>{underwriter.reputation}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="truncate">{underwriter.totalPoliciesUnderwritten} policies</span>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className={`text-base font-bold ${isSBF ? 'text-red-600' : 'text-coral'} whitespace-nowrap`}>
                                    ${finalPremium.toFixed(0)}
                                  </p>
                                  {isSBF && <span className="text-xs text-red-500 block">😱 INSANE!</span>}
                                  <p className="text-xs text-gray-500">/month</p>
                                </div>
                              </div>
                              
                              {/* Specialties Tags */}
                              <div className="flex flex-wrap gap-1 mb-2">
                                {underwriter.specialties.slice(0, 2).map((s: string) => (
                                  <span key={s} className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                                    isSBF ? 'bg-red-100 text-red-600' : 'bg-coral/10 text-coral'
                                  }`}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                              
                              {/* Stats Grid */}
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500 truncate">Coverage</p>
                                  <p className="font-semibold text-navy truncate">
                                    ${(underwriter.coverageLimit / 1000).toFixed(0)}K
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 truncate">Response</p>
                                  <p className="font-semibold text-navy truncate">{underwriter.responseTime}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 truncate">Approval</p>
                                  <p className={`font-semibold truncate ${
                                    isSBF ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {underwriter.claimApprovalRate}%
                                  </p>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(`✅ Selected ${underwriter.name}!\n\nContract would be bound on blockchain.\nThis is a demo - full integration coming soon.`);
                                    }}
                                    size="sm"
                                    className="w-full font-semibold text-sm"
                                    style={{ backgroundColor: 'var(--coral)' }}
                                  >
                                    Bind with {underwriter.name}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Benefits */}
                <div className="bg-coral/10 rounded-lg p-4 border border-coral/20">
                  <h4 className="text-xs font-bold text-navy mb-3 uppercase tracking-wide">Why Choose P2P?</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coral mt-0.5 flex-shrink-0" />
                      <span>Direct connection with underwriters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coral mt-0.5 flex-shrink-0" />
                      <span>Competitive pricing & negotiation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coral mt-0.5 flex-shrink-0" />
                      <span>Fair matching via blockchain randomness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coral mt-0.5 flex-shrink-0" />
                      <span>Choose your preferred underwriter</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center pt-6">
              <Button
                onClick={handleDeclineContract}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </div>
        )}

        {/* Icon row - Only show when wallet connected and not loading and not showing split view */}
        {isWorldIDVerified && walletAddress && !isLoading && !showSplitView && (
          <>
            <div className="flex justify-center gap-8 mt-12 opacity-0 animate-fade-in delay-400">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-teal" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Protected</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-coral" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Caring</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-teal" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Community</span>
              </div>
            </div>

            {/* Additional info section */}
            <div className="mt-8 text-center opacity-0 animate-fade-in delay-400">
              <p className="text-sm text-gray-500 font-light">
                Your information is encrypted and secure. We respond within 24 hours.
              </p>
            </div>
          </>
        )}

        {/* Bottom decorative line */}
        <div className="mt-16 flex items-center justify-center gap-4 opacity-0 animate-fade-in delay-400">
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
          <div className="w-2 h-2 rounded-full bg-coral/50" />
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
        </div>
      </div>

      {/* Entropy Debug Panel */}
      <EntropyDebugPanel
        show={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
        fairnessProof={fairnessProof || undefined}
        underwriters={matchedUnderwriters}
        originalOrder={undefined}
        shuffledOrder={undefined}
      />
    </div>
  )
}
