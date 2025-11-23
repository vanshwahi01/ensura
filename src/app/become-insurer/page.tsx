'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Select } from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import { Shield, Wallet, CheckCircle2, ArrowLeft, TrendingUp, Lock, AlertCircle } from 'lucide-react'

interface InsurerFormData {
  name: string
  email: string
  walletAddress: string
  specialties: string[]
  coverageLimit: string
  collateralAmount: string
  premiumMultiplier: string
  responseTime: string
  bio: string
  experience: string
  licenseNumber: string
}

export default function BecomeInsurerPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<InsurerFormData>({
    name: '',
    email: '',
    walletAddress: '',
    specialties: [],
    coverageLimit: '',
    collateralAmount: '',
    premiumMultiplier: '1.0',
    responseTime: '',
    bio: '',
    experience: '',
    licenseNumber: ''
  })
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const availableSpecialties = [
    'Health Insurance',
    'Life Insurance',
    'Auto Insurance',
    'Home Insurance',
    'Travel Insurance',
    'Business Insurance',
    'Disability Insurance',
    'Pet Insurance'
  ]

  const handleInputChange = (field: keyof InsurerFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => {
      const currentSpecialties = prev.specialties
      if (currentSpecialties.includes(specialty)) {
        return { ...prev, specialties: currentSpecialties.filter(s => s !== specialty) }
      } else {
        return { ...prev, specialties: [...currentSpecialties, specialty] }
      }
    })
  }

  const handleConnectWallet = async () => {
    setIsConnectingWallet(true)
    
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        }) as string[]
        
        if (accounts && accounts.length > 0) {
          setFormData(prev => ({ ...prev, walletAddress: accounts[0] }))
          console.log('✅ Wallet connected:', accounts[0])
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet to continue.\n\nFor demo purposes, we\'ll simulate a wallet connection.')
        const mockWallet = '0x' + Math.random().toString(16).substring(2, 42)
        setFormData(prev => ({ ...prev, walletAddress: mockWallet }))
        console.log('🔧 Demo wallet address:', mockWallet)
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      alert('Failed to connect wallet. Please try again.')
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Please enter your name')
      return false
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      alert('Please enter a valid email address')
      return false
    }
    if (!formData.walletAddress) {
      alert('Please connect your wallet')
      return false
    }
    if (formData.specialties.length === 0) {
      alert('Please select at least one insurance specialty')
      return false
    }
    if (!formData.coverageLimit || parseFloat(formData.coverageLimit) <= 0) {
      alert('Please enter a valid coverage limit')
      return false
    }
    if (!formData.collateralAmount || parseFloat(formData.collateralAmount) <= 0) {
      alert('Please enter a valid collateral amount')
      return false
    }
    if (!formData.premiumMultiplier || parseFloat(formData.premiumMultiplier) <= 0) {
      alert('Please enter a valid premium multiplier')
      return false
    }
    if (!formData.responseTime) {
      alert('Please select your typical response time')
      return false
    }
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setShowPreview(true)
  }

  const handleConfirmRegistration = async () => {
    setIsSubmitting(true)
    
    // Simulate blockchain transaction and backend registration
    setTimeout(() => {
      alert(
        '🎉 Congratulations! Your insurer profile has been created!\n\n' +
        '✅ Profile registered on blockchain\n' +
        '✅ Collateral locked in smart contract\n' +
        '✅ You are now visible in the marketplace\n\n' +
        'You will start receiving policy requests shortly.'
      )
      setIsSubmitting(false)
      router.push('/marketplace')
    }, 3000)
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  if (showPreview) {
    return (
      <div className="geometric-bg min-h-screen flex flex-col items-center justify-start px-6 py-12 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 border-2 border-teal/10 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-40 right-20 w-32 h-32 border-2 border-coral/10 rounded-lg rotate-45 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        
        <div className="max-w-4xl w-full z-10">
          <header className="text-center mb-12 opacity-0 animate-slide-up">
            <h1 
              className="text-6xl font-bold mb-4 tracking-tight"
              style={{ 
                fontFamily: "'Crimson Text', serif",
                color: 'var(--navy)',
                letterSpacing: '-0.02em'
              }}
            >
              Preview Your Profile
            </h1>
            <p 
              className="text-xl text-gray-600 font-light tracking-wide"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              This is how policy seekers will see you in the marketplace
            </p>
          </header>

          {/* Profile Preview Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-teal/20 mb-8 opacity-0 animate-scale-in delay-200">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal/20 to-coral/20 flex items-center justify-center text-5xl border-2 border-white shadow-lg">
                  👤
                </div>
              </div>

              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 
                      className="text-3xl font-bold text-navy mb-2"
                      style={{ fontFamily: "'Crimson Text', serif" }}
                    >
                      {formData.name}
                    </h2>
                    <p className="text-sm text-gray-600 mb-3">{formData.email}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded-lg inline-block">
                      <Wallet className="w-3 h-3" />
                      {formData.walletAddress.slice(0, 10)}...{formData.walletAddress.slice(-8)}
                    </div>
                  </div>
                  
                  {/* Premium Multiplier Display */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Premium Rate</p>
                    <p className="text-3xl font-bold text-coral" style={{ fontFamily: "'Crimson Text', serif" }}>
                      {formData.premiumMultiplier}×
                    </p>
                  </div>
                </div>

                {/* Bio */}
                {formData.bio && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">{formData.bio}</p>
                  </div>
                )}

                {/* Specialties */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-3 py-1 bg-teal/10 text-teal text-xs font-semibold rounded-full border border-teal/20"
                      >
                        {specialty.replace(' Insurance', '')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Coverage Limit</p>
                    <p className="text-sm font-bold text-navy">{formatCurrency(formData.coverageLimit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Collateral Locked</p>
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-teal" />
                      <p className="text-sm font-bold text-teal">{formatCurrency(formData.collateralAmount)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Response Time</p>
                    <p className="text-sm font-bold text-navy">{formData.responseTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Experience</p>
                    <p className="text-sm font-bold text-navy">{formData.experience}</p>
                  </div>
                </div>

                {/* License Info */}
                {formData.licenseNumber && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Licensed: {formData.licenseNumber}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Confirmation Section */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-coral animate-scale-in delay-400">
            <div className="text-center mb-6">
              <h3 
                className="text-2xl font-bold text-navy mb-2"
                style={{ fontFamily: "'Crimson Text', serif" }}
              >
                Ready to Join the Marketplace?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Confirm your registration and start underwriting policies
              </p>
            </div>

            <div className="bg-coral/5 rounded-lg p-4 mb-6 border border-coral/20">
              <h4 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-coral" />
                Important Information
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                  <span>Your collateral of <strong>{formatCurrency(formData.collateralAmount)}</strong> will be locked in a smart contract</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                  <span>You&apos;ll be visible to policy seekers matching your specialties</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                  <span>Claims are processed automatically via smart contracts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                  <span>Your reputation score will be built based on performance</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
                size="lg"
                className="font-semibold tracking-wide text-base px-10 border-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                onClick={handleConfirmRegistration}
                size="lg"
                className="font-semibold tracking-wide text-base px-10"
                style={{ 
                  backgroundColor: 'var(--coral)',
                  fontFamily: "'Outfit', sans-serif"
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registering...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Confirm & Register
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="geometric-bg min-h-screen flex flex-col items-center justify-start px-6 py-12 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 border-2 border-teal/10 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-40 right-20 w-32 h-32 border-2 border-coral/10 rounded-lg rotate-45 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-teal/10 animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      
      <div className="max-w-4xl w-full z-10">
        {/* Header Section */}
        <header className="text-center mb-12 opacity-0 animate-slide-up">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            size="sm"
            className="absolute left-0 top-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 
            className="text-7xl font-bold mb-4 tracking-tight"
            style={{ 
              fontFamily: "'Crimson Text', serif",
              color: 'var(--navy)',
              letterSpacing: '-0.02em'
            }}
          >
            Become an Insurer
          </h1>
          <p 
            className="text-xl text-gray-600 font-light tracking-wide"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Join the decentralized insurance marketplace
          </p>
        </header>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 opacity-0 animate-fade-in delay-200">
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 shadow-lg border border-teal/20 text-center">
            <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-teal" />
            </div>
            <h3 className="text-lg font-bold text-navy mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Secure & Transparent
            </h3>
            <p className="text-sm text-gray-600">
              Smart contracts ensure fair and transparent operations
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 shadow-lg border border-coral/20 text-center">
            <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-coral" />
            </div>
            <h3 className="text-lg font-bold text-navy mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Earn Premiums
            </h3>
            <p className="text-sm text-gray-600">
              Set your own rates and earn from underwriting
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 shadow-lg border border-teal/20 text-center">
            <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-teal" />
            </div>
            <h3 className="text-lg font-bold text-navy mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Build Reputation
            </h3>
            <p className="text-sm text-gray-600">
              Grow your profile with every successful policy
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6 opacity-0 animate-scale-in delay-300">
          <div className="relative">
            {/* Decorative corner elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-teal/30" />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-coral/30" />
            
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-teal/10">
              <h2 
                className="text-2xl font-bold text-navy mb-6"
                style={{ fontFamily: "'Crimson Text', serif" }}
              >
                Insurer Registration
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
                      htmlFor="name" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Full Name / Business Name <span className="text-coral">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe / Acme Insurance"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Email Address <span className="text-coral">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="insurer@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="licenseNumber" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      License Number (Optional)
                    </label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder="INS-123456"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label 
                      htmlFor="experience" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Years of Experience <span className="text-coral">*</span>
                    </label>
                    <Select
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      required
                    >
                      <option value="">Select experience...</option>
                      <option value="< 1 year">Less than 1 year</option>
                      <option value="1-3 years">1-3 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-10 years">5-10 years</option>
                      <option value="10+ years">10+ years</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Wallet Connection Section */}
              <div className="mb-8">
                <h3 
                  className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase"
                  style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                >
                  Blockchain Wallet
                </h3>
                {!formData.walletAddress ? (
                  <div className="bg-teal/5 rounded-lg p-6 border border-teal/20">
                    <p className="text-sm text-gray-700 mb-4">
                      Connect your wallet to receive premium payments and lock collateral
                    </p>
                    <Button
                      type="button"
                      onClick={handleConnectWallet}
                      disabled={isConnectingWallet}
                      className="w-full"
                      style={{ 
                        backgroundColor: 'var(--teal)',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                    >
                      {isConnectingWallet ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Connecting...
                        </span>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-semibold text-green-900">Wallet Connected</p>
                    </div>
                    <p className="text-xs text-gray-600 font-mono break-all">
                      {formData.walletAddress}
                    </p>
                  </div>
                )}
              </div>

              {/* Insurance Specialties Section */}
              <div className="mb-8">
                <h3 
                  className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase"
                  style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                >
                  Insurance Specialties <span className="text-coral">*</span>
                </h3>
                <p className="text-xs text-gray-600 mb-3">Select all types of insurance you want to underwrite</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSpecialties.map((specialty) => {
                    const isSelected = formData.specialties.includes(specialty)
                    return (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => handleSpecialtyToggle(specialty)}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          isSelected
                            ? 'bg-teal/10 border-teal text-teal'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-teal/50'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                        {specialty.replace(' Insurance', '')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Financial Details Section */}
              <div className="mb-8">
                <h3 
                  className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase"
                  style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                >
                  Financial Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label 
                      htmlFor="coverageLimit" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Max Coverage Limit ($) <span className="text-coral">*</span>
                    </label>
                    <Input
                      id="coverageLimit"
                      type="number"
                      placeholder="500000"
                      min="10000"
                      step="1000"
                      value={formData.coverageLimit}
                      onChange={(e) => handleInputChange('coverageLimit', e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum coverage per policy</p>
                  </div>
                  <div>
                    <label 
                      htmlFor="collateralAmount" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Collateral Amount ($) <span className="text-coral">*</span>
                    </label>
                    <Input
                      id="collateralAmount"
                      type="number"
                      placeholder="100000"
                      min="1000"
                      step="1000"
                      value={formData.collateralAmount}
                      onChange={(e) => handleInputChange('collateralAmount', e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Locked in smart contract</p>
                  </div>
                  <div>
                    <label 
                      htmlFor="premiumMultiplier" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Premium Multiplier <span className="text-coral">*</span>
                    </label>
                    <Input
                      id="premiumMultiplier"
                      type="number"
                      placeholder="1.05"
                      min="0.5"
                      max="3.0"
                      step="0.01"
                      value={formData.premiumMultiplier}
                      onChange={(e) => handleInputChange('premiumMultiplier', e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Base premium × multiplier</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-900">
                    💡 <strong>Example:</strong> If a client&apos;s base premium is $150/month and your multiplier is {formData.premiumMultiplier || '1.05'}, 
                    they&apos;ll pay <strong>{formatCurrency(150 * parseFloat(formData.premiumMultiplier || '1.05'))}/month</strong> for your coverage.
                  </p>
                </div>
              </div>

              {/* Response Time Section */}
              <div className="mb-8">
                <h3 
                  className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase"
                  style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                >
                  Service Commitment
                </h3>
                <div>
                  <label 
                    htmlFor="responseTime" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Typical Response Time <span className="text-coral">*</span>
                  </label>
                  <Select
                    id="responseTime"
                    value={formData.responseTime}
                    onChange={(e) => handleInputChange('responseTime', e.target.value)}
                    required
                  >
                    <option value="">Select response time...</option>
                    <option value="< 1 hour">Less than 1 hour</option>
                    <option value="< 2 hours">Less than 2 hours</option>
                    <option value="< 3 hours">Less than 3 hours</option>
                    <option value="< 4 hours">Less than 4 hours</option>
                    <option value="< 24 hours">Within 24 hours</option>
                    <option value="< 48 hours">Within 48 hours</option>
                  </Select>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mb-6">
                <h3 
                  className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase"
                  style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                >
                  About You
                </h3>
                <label 
                  htmlFor="bio" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Professional Bio
                </label>
                <Textarea
                  id="bio"
                  placeholder="Tell potential clients about your background, expertise, and why they should choose you as their insurer..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="min-h-[120px]"
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
                  Preview Profile →
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Bottom decorative line */}
        <div className="mt-16 flex items-center justify-center gap-4 opacity-0 animate-fade-in delay-400">
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
          <div className="w-2 h-2 rounded-full bg-coral/50" />
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
        </div>
      </div>
    </div>
  )
}

