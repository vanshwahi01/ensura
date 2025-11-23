import { ethers } from 'ethers'

// Flare Coston2 Network Configuration
export const COSTON2_CONFIG = {
  chainId: 114,
  chainIdHex: '0x72',
  name: 'Coston2',
  rpcUrl: 'https://coston2-api.flare.network/ext/C/rpc',
  explorerUrl: 'https://coston2-explorer.flare.network',
  nativeCurrency: {
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
    decimals: 18
  }
}

// Deployed InsuranceContract on Coston2 (VERIFIED)
export const INSURANCE_CONTRACT_ADDRESS = '0xAc0d07907b2c6714b6B99AF44FC52cA42906e701'

// Demo Contract (Simplified, no FDC - for easy real transactions)
export const DEMO_CONTRACT_ADDRESS = '0x4AA9E042EA557A08f1454B6939081C7039f6ea3a'
export const USE_DEMO_CONTRACT = true // Set to true to show real contract in demo

// Pre-seeded offer IDs (update after running seed script)
export const DEMO_OFFER_IDS = {
  agency: 0,  // Alice - Auto Insurance (using same offer for demo)
  p2p: 0      // Alice - Auto Insurance
}

// Real transaction that created the offer (for demo reference)
export const REAL_OFFER_CREATION_TX = '0xbb21e3b6c0e2c64995af22adbf35123fbf00f4184ff162a1e6ee428127c7f824'

// Demo Contract ABI (Simplified)
export const DEMO_CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'offerId', type: 'uint256' }],
    name: 'acceptOffer',
    outputs: [{ internalType: 'uint256', name: 'policyId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'offerId', type: 'uint256' }],
    name: 'getOffer',
    outputs: [
      { internalType: 'address', name: 'provider', type: 'address' },
      { internalType: 'string', name: 'providerName', type: 'string' },
      { internalType: 'string', name: 'insuranceType', type: 'string' },
      { internalType: 'uint256', name: 'premium', type: 'uint256' },
      { internalType: 'uint256', name: 'coverage', type: 'uint256' },
      { internalType: 'uint256', name: 'validUntil', type: 'uint256' },
      { internalType: 'bool', name: 'funded', type: 'bool' },
      { internalType: 'bool', name: 'accepted', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getOfferCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
]

// Minimal ABI for the functions we need
export const INSURANCE_CONTRACT_ABI = [
  // accept function - pays premium and accepts offer
  {
    inputs: [{ internalType: 'uint256', name: 'offerId', type: 'uint256' }],
    name: 'accept',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  // getQuote function - request insurance quote
  {
    inputs: [
      { internalType: 'string', name: 'metadata', type: 'string' },
      {
        components: [
          {
            components: [
              { internalType: 'bytes32', name: 'attestationType', type: 'bytes32' },
              { internalType: 'bytes32', name: 'sourceId', type: 'bytes32' },
              { internalType: 'uint64', name: 'votingRound', type: 'uint64' },
              { internalType: 'uint64', name: 'lowestUsedTimestamp', type: 'uint64' },
              {
                components: [
                  { internalType: 'bytes32', name: 'requestBody', type: 'bytes32' },
                  { internalType: 'bytes', name: 'responseBody', type: 'bytes' }
                ],
                internalType: 'struct IWeb2Json.ResponseBody',
                name: 'responseBody',
                type: 'tuple'
              }
            ],
            internalType: 'struct IWeb2Json.Response',
            name: 'data',
            type: 'tuple'
          },
          {
            components: [
              { internalType: 'bytes32[]', name: 'merkleProof', type: 'bytes32[]' }
            ],
            internalType: 'struct IWeb2Json.Proof',
            name: 'merkleProof',
            type: 'tuple'
          }
        ],
        internalType: 'struct IWeb2Json.Proof',
        name: 'proof',
        type: 'tuple'
      }
    ],
    name: 'getQuote',
    outputs: [{ internalType: 'uint256', name: 'quoteRequestId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // View functions
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'offers',
    outputs: [
      { internalType: 'uint256', name: 'quoteRequestId', type: 'uint256' },
      { internalType: 'address', name: 'provider', type: 'address' },
      { internalType: 'uint256', name: 'premium', type: 'uint256' },
      { internalType: 'uint256', name: 'coverageAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'validUntil', type: 'uint256' },
      { internalType: 'bool', name: 'accepted', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]

export interface BindingDetails {
  offerId: number
  premium: string // In FLR
  coverageAmount: string // In FLR
  underwriterAddress: string
  underwriterName: string
  insuranceType: string
  isAgency: boolean
}

export interface TransactionResult {
  success: boolean
  txHash?: string
  explorerUrl?: string
  offerId?: number
  error?: string
}

/**
 * Check if user is connected to Coston2
 */
export async function isOnCoston2(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
    return parseInt(chainId, 16) === COSTON2_CONFIG.chainId
  } catch (error) {
    console.error('Error checking network:', error)
    return false
  }
}

/**
 * Switch to Coston2 network
 */
export async function switchToCoston2(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: COSTON2_CONFIG.chainIdHex }],
    })
    return true
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: COSTON2_CONFIG.chainIdHex,
              chainName: COSTON2_CONFIG.name,
              nativeCurrency: COSTON2_CONFIG.nativeCurrency,
              rpcUrls: [COSTON2_CONFIG.rpcUrl],
              blockExplorerUrls: [COSTON2_CONFIG.explorerUrl],
            },
          ],
        })
        return true
      } catch (addError) {
        console.error('Error adding network:', addError)
        return false
      }
    }
    console.error('Error switching network:', switchError)
    return false
  }
}

/**
 * Accept an insurance offer - simulates for demo but shows real contract
 */
export async function acceptInsuranceOffer(
  details: BindingDetails
): Promise<TransactionResult> {
  // Check if wallet is available and we're on the right network
  const hasWallet = typeof window !== 'undefined' && window.ethereum
  const onCoston2 = hasWallet ? await isOnCoston2() : false
  
  // If on Coston2 with wallet, user can choose to use real transaction
  // For now, always simulate for demo purposes (shows real contract links)
  // To enable real transactions, uncomment the lines below:
  /*
  if (hasWallet && onCoston2 && USE_DEMO_CONTRACT && DEMO_CONTRACT_ADDRESS) {
    return acceptDemoContractOffer(details)
  }
  */
  
  // Simulate transaction but show real contract
  return simulateTransactionWithRealContract(details)
}

/**
 * REAL TRANSACTION: Accept offer on demo contract
 */
async function acceptDemoContractOffer(
  details: BindingDetails
): Promise<TransactionResult> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No Web3 wallet detected. Please install MetaMask.')
    }

    console.log('🔗 Using REAL demo contract transaction')
    console.log('📋 Binding Details:', {
      offerId: details.offerId,
      premium: details.premium + ' C2FLR',
      coverage: details.coverageAmount + ' C2FLR',
      underwriter: details.underwriterName,
      type: details.insuranceType
    })

    // Check network
    const onCoston2 = await isOnCoston2()
    if (!onCoston2) {
      const switched = await switchToCoston2()
      if (!switched) {
        throw new Error('Please switch to Flare Coston2 network')
      }
    }

    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    // Connect to demo contract
    const contract = new ethers.Contract(
      DEMO_CONTRACT_ADDRESS,
      DEMO_CONTRACT_ABI,
      signer
    )

    // Convert premium to wei
    const premiumWei = ethers.parseEther(details.premium)

    console.log('📝 Calling acceptOffer() on demo contract...')
    console.log('   Contract:', DEMO_CONTRACT_ADDRESS)
    console.log('   Offer ID:', details.offerId)
    console.log('   Premium:', details.premium, 'C2FLR')

    // Call acceptOffer function
    const tx = await contract.acceptOffer(details.offerId, {
      value: premiumWei,
      gasLimit: 300000
    })

    console.log('⏳ Transaction submitted:', tx.hash)
    console.log('   Waiting for confirmation...')

    // Wait for confirmation
    const receipt = await tx.wait()

    console.log('✅ Transaction confirmed!')
    console.log('   Block:', receipt.blockNumber)
    console.log('   Gas used:', receipt.gasUsed.toString())

    const explorerUrl = `${COSTON2_CONFIG.explorerUrl}/tx/${tx.hash}`

    return {
      success: true,
      txHash: tx.hash,
      explorerUrl,
      offerId: details.offerId
    }
  } catch (error: any) {
    console.error('❌ Real transaction failed:', error)
    
    let errorMessage = 'Transaction failed'
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transaction rejected by user'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * SIMULATED: Generate demo transaction that links to REAL deployed contract
 */
async function simulateTransactionWithRealContract(
  details: BindingDetails
): Promise<TransactionResult> {
  try {
    console.log('🎬 Starting demo transaction (simulated for localhost)...')
    console.log('📋 Binding Details:', {
      offerId: details.offerId,
      premium: details.premium + ' C2FLR',
      coverage: details.coverageAmount + ' C2FLR',
      underwriter: details.underwriterName,
      type: details.insuranceType
    })
    console.log('🔗 REAL Contract:', DEMO_CONTRACT_ADDRESS)
    console.log('🌐 View on Coston2:', `${COSTON2_CONFIG.explorerUrl}/address/${DEMO_CONTRACT_ADDRESS}`)

    // Simulate blockchain transaction delay
    await simulateTransactionDelay()

    // Generate realistic transaction hash for demo
    const txHash = generateSimulatedTxHash()
    const explorerUrl = `${COSTON2_CONFIG.explorerUrl}/tx/${txHash}`

    console.log('✅ DEMO: Insurance binding (simulated transaction)')
    console.log('📝 Real Contract:', DEMO_CONTRACT_ADDRESS)
    console.log('⚡ Function: acceptOffer(uint256 offerId)')
    console.log('🆔 Offer ID:', details.offerId)
    console.log('💰 Premium:', details.premium, 'C2FLR')
    console.log('🛡️ Coverage:', details.coverageAmount, 'C2FLR')
    console.log('🔗 Demo Tx Hash:', txHash)
    console.log('🔍 Real Offer Created:', `${COSTON2_CONFIG.explorerUrl}/tx/${REAL_OFFER_CREATION_TX}`)
    console.log('')
    console.log('💡 NOTE: This is a simulated transaction for demo purposes.')
    console.log('   The contract IS REAL and deployed on Coston2!')
    console.log('   View the contract:', `${COSTON2_CONFIG.explorerUrl}/address/${DEMO_CONTRACT_ADDRESS}`)

    return {
      success: true,
      txHash,
      explorerUrl,
      offerId: details.offerId
    }
  } catch (error) {
    console.error('❌ Error in simulation:', error)
    return {
      success: false,
      error: (error as Error).message || 'Transaction failed'
    }
  }
}

/**
 * ACTUAL contract interaction (commented for demo, but ready for production)
 */
export async function acceptInsuranceOfferReal(
  details: BindingDetails
): Promise<TransactionResult> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No Web3 wallet detected')
    }

    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    // Create contract instance
    const contract = new ethers.Contract(
      INSURANCE_CONTRACT_ADDRESS,
      INSURANCE_CONTRACT_ABI,
      signer
    )

    // Convert premium to wei
    const premiumWei = ethers.parseEther(details.premium)

    // Call accept function with premium as value
    const tx = await contract.accept(details.offerId, {
      value: premiumWei,
      gasLimit: 300000 // Reasonable gas limit
    })

    console.log('Transaction submitted:', tx.hash)

    // Wait for confirmation
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt.hash,
      explorerUrl: `${COSTON2_CONFIG.explorerUrl}/tx/${receipt.hash}`,
      offerId: details.offerId
    }
  } catch (error) {
    console.error('Error accepting offer:', error)
    return {
      success: false,
      error: (error as Error).message || 'Transaction failed'
    }
  }
}

/**
 * Get contract explorer URL - points to REAL deployed demo contract
 */
export function getContractExplorerUrl(): string {
  const contractAddress = USE_DEMO_CONTRACT ? DEMO_CONTRACT_ADDRESS : INSURANCE_CONTRACT_ADDRESS
  return `${COSTON2_CONFIG.explorerUrl}/address/${contractAddress}`
}

/**
 * Get transaction explorer URL
 */
export function getTxExplorerUrl(txHash: string): string {
  return `${COSTON2_CONFIG.explorerUrl}/tx/${txHash}`
}

/**
 * Format FLR amount for display
 */
export function formatFLR(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} C2FLR`
}

// Helper functions for demo

function simulateTransactionDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000))
}

function generateSimulatedTxHash(): string {
  const chars = '0123456789abcdef'
  let hash = '0x'
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)]
  }
  return hash
}

/**
 * Convert USD premium to FLR (simulated conversion rate)
 */
export function convertUSDtoFLR(usdAmount: number): string {
  // Simulated C2FLR price: ~$0.025 per token
  const flrAmount = usdAmount / 0.025
  return flrAmount.toFixed(2)
}

