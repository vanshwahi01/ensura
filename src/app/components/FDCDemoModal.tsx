import * as React from 'react'
import Image from 'next/image'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './ui/modal'
import { Button } from './ui/button'
import { Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react'

interface FDCDemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FDCDemoModal({ isOpen, onClose }: FDCDemoModalProps) {
  const [isRunning, setIsRunning] = React.useState(false)
  const [output, setOutput] = React.useState<string>('')
  const [error, setError] = React.useState<string>('')

  const runDemo = async () => {
    setIsRunning(true)
    setError('')
    setOutput('Starting FDC Attestation Demo...\n\n')

    try {
      const response = await fetch('/api/fdc-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let done = false
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) {
            const text = decoder.decode(value)
            setOutput(prev => prev + text)
          }
        }
      }

      if (!response.ok) {
        throw new Error('Demo execution failed')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsRunning(false)
    }
  }

  React.useEffect(() => {
    if (isOpen && !output && !isRunning) {
      runDemo()
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <div className="flex items-center gap-3">
          <Image 
            src="/flare-logo.svg" 
            alt="Flare Network" 
            width={32} 
            height={32}
            className="rounded"
          />
          <div>
            <h3 className="text-xl font-bold text-navy" style={{ fontFamily: "'Crimson Text', serif" }}>
              FDC Attestation Workflow
            </h3>
            <p className="text-xs text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Flare Data Connector Integration Demo
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {isRunning && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-6 h-6 animate-spin text-teal" />
            <p className="text-sm text-gray-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Running FDC attestation tests...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Demo Execution Failed
                </p>
                <p className="text-xs text-red-700 mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {output && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[400px] text-xs font-mono">
              <pre className="text-green-400 whitespace-pre-wrap">
                {output}
              </pre>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <p className="font-semibold mb-1">About This Demo</p>
                  <p>
                    This demo validates our FDC integration by testing the attestation workflow, 
                    API accessibility, and smart contract readiness. It confirms all components 
                    are working correctly on Flare's Coston2 testnet.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href="https://coston2-explorer.flare.network/address/0xAc0d07907b2c6714b6B99AF44FC52cA42906e701"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <ExternalLink className="w-3 h-3" />
                View Contract on Explorer
              </a>
              <button
                onClick={runDemo}
                disabled={isRunning}
                className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-dark font-semibold disabled:opacity-50"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Run Again
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          onClick={onClose}
          variant="outline"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}

