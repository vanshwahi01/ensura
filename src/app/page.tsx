'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ISuccessResult } from '@worldcoin/idkit'
import dynamic from 'next/dynamic'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Select } from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import { FileUpload } from '@/app/components/ui/fileupload'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/app/components/ui/modal'
import { Shield, Heart, Users, Loader2, CheckCircle2, Wallet, Globe } from 'lucide-react'

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
  const [showContract, setShowContract] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [currentStage, setCurrentStage] = useState<ProgressStage>({ stage: 0, message: '', progress: 0 })
  const [apiResult, setApiResult] = useState('')
  
  // World ID & Wallet State
  const [isWorldIDVerified, setIsWorldIDVerified] = useState(false)
  const [worldIDData, setWorldIDData] = useState<ISuccessResult | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)

  // API call with progress updates
  const callBackend = async () => {
    const stages = [
      { stage: 1, message: `Analyzing ${formData.insuranceType} requirements for ${formData.firstName}...`, progress: 33, delay: 4000 },
      { stage: 2, message: 'Consulting AI insurance advisor for personalized recommendations...', progress: 66, delay: 5000 },
      { stage: 3, message: 'Generating your comprehensive quote with pricing...', progress: 100, delay: 5000 }
    ]

    for (const stage of stages) {
      setCurrentStage(stage)
      await new Promise(resolve => setTimeout(resolve, stage.delay))
    }

    // Call the API
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

    setIsLoading(false)
    setShowContract(true)
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

  const handleAcceptClick = () => {
    // Extract base premium from AI response (simple extraction for demo)
    const premiumMatch = apiResult.match(/\$(\d+(?:,\d+)*(?:\.\d{2})?)/);
    const basePremium = premiumMatch ? premiumMatch[1].replace(/,/g, '') : '150';
    
    // Navigate to marketplace with quote data
    const params = new URLSearchParams({
      type: formData.insuranceType,
      premium: basePremium,
      name: formData.firstName,
    });
    
    router.push(`/marketplace?${params.toString()}`);
  }

  const handleConfirmAccept = () => {
    // This is no longer used - keeping for backwards compatibility
    setShowAcceptModal(false)
    handleAcceptClick()
  }

  const handleDeclineContract = () => {
    const confirmed = confirm('Are you sure you want to decline this contract? You can submit a new request anytime.')
    if (confirmed) {
      // Reset to initial state
      setShowContract(false)
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
        {!isWorldIDVerified && !isLoading && !showContract && (
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
        {isWorldIDVerified && !walletAddress && !isLoading && !showContract && (
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
        {isWorldIDVerified && walletAddress && !isLoading && !showContract && (
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
                        {[1, 2, 3].map((stage) => (
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

        {showContract && (
          // Contract Review View
          <div className="space-y-6 animate-scale-in">
            <div className="relative">
              {/* Decorative corner elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-teal/30" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-coral/30" />
              
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-10 shadow-2xl border border-teal/20">
                {/* Header */}
                <div className="border-b-2 border-teal/20 pb-6 mb-8">
                  <h2 
                    className="text-4xl font-bold text-navy mb-2"
                    style={{ fontFamily: "'Crimson Text', serif" }}
                  >
                    Your Insurance Quote
                  </h2>
                  <p className="text-gray-600 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Review your personalized coverage and pricing below
                  </p>
                </div>

                {/* Insurance Policy Quote */}
                <div className="space-y-6 mb-8">
                  <div className="bg-gradient-to-br from-teal/5 to-teal/10 rounded-xl p-8 border-2 border-teal/20 shadow-lg">
                    <h3 className="text-xl font-bold text-navy mb-6 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      <Shield className="w-5 h-5 text-teal" />
                      Your Personalized Quote
                    </h3>
                    <div className="bg-white p-8 rounded-xl shadow-inner border border-gray-100 quote-content">
                      <div 
                        className="text-gray-800 leading-relaxed space-y-4"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                        dangerouslySetInnerHTML={{ 
                          __html: apiResult
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-navy font-bold">$1</strong>')
                            .replace(/^(Hello.*?)$/gm, '<p class="text-xl font-semibold text-teal mb-4">$1</p>')
                            .replace(/^(Dear.*?)$/gm, '<p class="text-xl font-semibold text-teal mb-4">$1</p>')
                            .replace(/\$(\d{1,3}(,\d{3})*(\.\d{2})?)/g, '<span class="text-coral font-bold text-lg">$$$1</span>')
                            .replace(/^(COVERAGE RECOMMENDATION|PRICING|WHY THIS WORKS|IMPORTANT TO KNOW|NEXT STEPS|Coverage|Pricing|Next Steps):/gm, '<h4 class="text-base font-bold text-navy mt-6 mb-2 uppercase tracking-wide" style="font-size: 0.875rem; letter-spacing: 0.05em;">$1:</h4>')
                            .replace(/^•\s/gm, '<span class="text-teal">•</span> ')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Decision Prompt */}
                <div className="bg-teal/5 rounded-lg p-6 border border-teal/20 mb-8">
                  <p className="text-center text-lg font-medium text-navy mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Ready to find matching underwriters?
                  </p>
                  <p className="text-center text-sm text-gray-600">
                    We&apos;ll match you with real underwriters willing to provide coverage
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleDeclineContract}
                    variant="outline"
                    size="lg"
                    className="font-semibold tracking-wide text-base px-10 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Start Over
                  </Button>
                  <Button
                    onClick={handleAcceptClick}
                    size="lg"
                    className="font-semibold tracking-wide text-base px-10"
                    style={{ 
                      backgroundColor: 'var(--coral)',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  >
                    Find Underwriters →
                  </Button>
                </div>

                {/* Fine Print */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    By accepting this contract, you agree to the terms and conditions outlined above. 
                    A copy of this contract will be sent to your registered email address.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Icon row - Only show when wallet connected and not loading and not showing contract */}
        {isWorldIDVerified && walletAddress && !isLoading && !showContract && (
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

      {/* Acceptance Confirmation Modal */}
      <Modal isOpen={showAcceptModal} onClose={() => setShowAcceptModal(false)}>
        <ModalHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-teal" />
            </div>
            <h3 
              className="text-2xl font-bold text-navy"
              style={{ fontFamily: "'Crimson Text', serif" }}
            >
              Confirm Acceptance
            </h3>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Are you sure you want to accept this insurance contract?
          </p>
          <div className="bg-teal/5 rounded-lg p-4 border border-teal/10">
            <p className="text-sm text-gray-600 mb-2">By accepting, you agree to:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• All terms and conditions outlined in the policy quote</li>
              <li>• The coverage details and premium specified above</li>
              <li>• Legal binding of this insurance contract</li>
            </ul>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            onClick={() => setShowAcceptModal(false)}
            variant="outline"
            className="font-medium"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAccept}
            className="font-semibold"
            style={{ 
              backgroundColor: 'var(--teal)',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            Yes, Accept Contract
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
