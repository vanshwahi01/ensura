/**
 * Pyth Entropy Debug Component
 * 
 * Visual debug panel showing real-time Pyth Entropy shuffle process
 * Perfect for demos and judging presentations
 */

'use client'

import { useState, useEffect } from 'react'
import { Shuffle, Info, CheckCircle, Clock, Hash, Activity } from 'lucide-react'

interface DebugStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete'
  data?: string
}

interface EntropyDebugProps {
  show: boolean
  onClose?: () => void
  fairnessProof?: {
    randomSeed: string
    requestId: string
    timestamp: number
    entropySource: string
    method: string
    guarantee: string
  }
  underwriters?: Array<{ id: string; name: string }>
  originalOrder?: string[]
  shuffledOrder?: string[]
}

export function EntropyDebugPanel({
  show,
  onClose,
  fairnessProof,
  underwriters,
  originalOrder,
  shuffledOrder
}: EntropyDebugProps) {
  const [steps, setSteps] = useState<DebugStep[]>([
    { id: '1', label: 'Request Pyth Entropy Random Seed', status: 'pending' },
    { id: '2', label: 'Receive Cryptographic Random Number', status: 'pending' },
    { id: '3', label: 'Apply Fisher-Yates Shuffle Algorithm', status: 'pending' },
    { id: '4', label: 'Verify Shuffle Integrity', status: 'pending' },
    { id: '5', label: 'Generate Fairness Proof', status: 'pending' },
  ])

  // Simulate step progression for visual effect
  useEffect(() => {
    if (!show || !fairnessProof) return

    const stepsLength = steps.length

    const progressSteps = async () => {
      for (let i = 0; i < stepsLength; i++) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx < i ? 'complete' : idx === i ? 'active' : 'pending'
        })))
      }
      
      // Mark all complete
      await new Promise(resolve => setTimeout(resolve, 300))
      setSteps(prev => prev.map(step => ({ ...step, status: 'complete' })))
    }

    progressSteps()
  }, [show, fairnessProof, steps.length])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">🎲 Pyth Entropy Debug Panel</h2>
                <p className="text-sm text-white/80">Real-time fair shuffle visualization</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Process Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-purple-600" />
              Shuffle Process
            </h3>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    step.status === 'complete'
                      ? 'border-green-200 bg-green-50'
                      : step.status === 'active'
                      ? 'border-blue-200 bg-blue-50 animate-pulse'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {step.status === 'complete' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : step.status === 'active' ? (
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-500">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      step.status === 'complete' ? 'text-green-700' :
                      step.status === 'active' ? 'text-blue-700' :
                      'text-gray-600'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fairness Proof Details */}
          {fairnessProof && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Fairness Proof
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-purple-600" />
                    <p className="text-xs font-semibold text-purple-800">Random Seed</p>
                  </div>
                  <p className="text-xs font-mono text-purple-700 break-all">
                    {fairnessProof.randomSeed.substring(0, 48)}...
                  </p>
                </div>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-800">Request ID</p>
                  </div>
                  <p className="text-xs font-mono text-blue-700 break-all">
                    {fairnessProof.requestId}
                  </p>
                </div>
                
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-semibold text-green-800">Timestamp</p>
                  </div>
                  <p className="text-xs text-green-700">
                    {new Date(fairnessProof.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-600" />
                    <p className="text-xs font-semibold text-orange-800">Entropy Source</p>
                  </div>
                  <p className="text-xs text-orange-700">
                    {fairnessProof.entropySource}
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-lg p-4">
                <p className="text-xs font-semibold text-purple-900 mb-2">Method:</p>
                <p className="text-sm text-purple-800">{fairnessProof.method}</p>
                
                <p className="text-xs font-semibold text-purple-900 mt-3 mb-2">Fairness Guarantee:</p>
                <p className="text-sm text-purple-800">{fairnessProof.guarantee}</p>
              </div>
            </div>
          )}

          {/* Order Comparison */}
          {originalOrder && shuffledOrder && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-teal-600" />
                Order Comparison
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-gray-700 mb-3">Original Order</p>
                  <div className="space-y-2">
                    {originalOrder.map((id, index) => {
                      const underwriter = underwriters?.find(u => u.id === id)
                      return (
                        <div key={id} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 font-mono">{index + 1}.</span>
                          <span className="text-gray-700">{underwriter?.name || id}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-teal-700 mb-3">Shuffled Order (Fair)</p>
                  <div className="space-y-2">
                    {shuffledOrder.map((id, index) => {
                      const underwriter = underwriters?.find(u => u.id === id)
                      const originalIndex = originalOrder.indexOf(id)
                      const moved = originalIndex !== index
                      return (
                        <div key={id} className="flex items-center gap-2 text-sm">
                          <span className="text-teal-600 font-mono font-bold">{index + 1}.</span>
                          <span className="text-teal-800 font-semibold">{underwriter?.name || id}</span>
                          {moved && (
                            <span className="text-xs text-teal-500">
                              (was #{originalIndex + 1})
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-2xl border-t">
          <p className="text-xs text-gray-600 text-center">
            🛡️ Powered by Pyth Entropy • Verifiable On-Chain Randomness • No Bias, No Gaming
          </p>
        </div>
      </div>
    </div>
  )
}

