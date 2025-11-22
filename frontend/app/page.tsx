'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Shield, Heart, Users, Loader2, CheckCircle2 } from 'lucide-react'

interface ProgressStage {
  stage: number
  message: string
  progress: number
}

export default function Home() {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [currentStage, setCurrentStage] = useState<ProgressStage>({ stage: 0, message: '', progress: 0 })
  const [apiResult, setApiResult] = useState('')

  // API call with progress updates
  const callBackend = async () => {
    const stages = [
      { stage: 1, message: 'Analyzing your insurance needs...', progress: 33, delay: 6000 },
      { stage: 2, message: 'Matching with best coverage options...', progress: 66, delay: 7000 },
      { stage: 3, message: 'Preparing your personalized quote...', progress: 100, delay: 7000 }
    ]

    for (const stage of stages) {
      setCurrentStage(stage)
      await new Promise(resolve => setTimeout(resolve, stage.delay))
    }

    // Call the API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerAddress: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
          query: message,
          fallbackFee: 0
        })
      })
      
      if (!response.ok) {
        const text = await response.text()
        setApiResult(`Error ${response.status}: ${text}`)
      } else {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          // Extract just the content from the response
          setApiResult(data.response?.content || JSON.stringify(data, null, 2))
        } else {
          const text = await response.text()
          setApiResult(`Received non-JSON response:\n${text}`)
        }
      }
    } catch (error) {
      setApiResult('Error: ' + (error as Error).message)
    }

    setIsLoading(false)
    setShowContract(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    
    setIsLoading(true)
    callBackend()
  }

  const handleAcceptClick = () => {
    setShowAcceptModal(true)
  }

  const handleConfirmAccept = () => {
    // Contract accepted
    setShowAcceptModal(false)
    alert('Contract accepted! Your policy is now active. We will send confirmation to your email.')
    // Reset to initial state
    setShowContract(false)
    setMessage('')
    setCurrentStage({ stage: 0, message: '', progress: 0 })
  }

  const handleDeclineContract = () => {
    const confirmed = confirm('Are you sure you want to decline this contract? You can submit a new request anytime.')
    if (confirmed) {
      // Reset to initial state
      setShowContract(false)
      setMessage('')
      setCurrentStage({ stage: 0, message: '', progress: 0 })
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
          <h1 
            className="text-8xl font-bold mb-4 tracking-tight"
            style={{ 
              fontFamily: "'Crimson Text', serif",
              color: 'var(--navy)',
              letterSpacing: '-0.02em'
            }}
          >
            HLife
          </h1>
          <p 
            className="text-xl text-gray-600 font-light tracking-wide"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            You are safe with us
          </p>
        </header>

        {/* Main Form Section */}
        {!isLoading && !showContract && (
          <form onSubmit={handleSubmit} className="space-y-6 opacity-0 animate-scale-in delay-300">
            <div className="relative">
              {/* Decorative corner elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-teal/30" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-coral/30" />
              
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-teal/10">
                <label 
                  htmlFor="message" 
                  className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide uppercase"
                  style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}
                >
                  Share Your Story
                </label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your insurance needs, concerns, or questions. We're here to listen and help protect what matters most to you..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[300px] text-lg"
                />
                
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
                    Submit
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
                    Your Insurance Contract
                  </h2>
                  <p className="text-gray-600 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Please review the terms and conditions below
                  </p>
                </div>

                {/* Insurance Policy Quote */}
                <div className="space-y-6 mb-8">
                  <div className="bg-teal/5 rounded-lg p-8 border border-teal/10">
                    <h3 className="text-lg font-semibold text-navy mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      Your Insurance Policy Quote
                    </h3>
                    <div className="bg-white p-6 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {apiResult}
                    </div>
                  </div>
                </div>

                {/* Decision Prompt */}
                <div className="bg-coral/5 rounded-lg p-6 border border-coral/20 mb-8">
                  <p className="text-center text-lg font-medium text-navy mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Do you accept the terms of this insurance contract?
                  </p>
                  <p className="text-center text-sm text-gray-600">
                    Your decision is required to proceed
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
                    Decline
                  </Button>
                  <Button
                    onClick={handleAcceptClick}
                    size="lg"
                    className="font-semibold tracking-wide text-base px-10"
                    style={{ 
                      backgroundColor: 'var(--teal)',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  >
                    Accept Contract
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

        {/* Icon row - Only show when not loading and not showing contract */}
        {!isLoading && !showContract && (
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
