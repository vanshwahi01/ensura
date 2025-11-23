import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
import { brokerService, OFFICIAL_PROVIDERS } from '@/lib/brokerService';
import { getSystemPrompt } from '@/lib/aiConfig';

/**
 * Insurance Quote API Endpoint
 * 
 * This endpoint generates and stores insurance quotes using 0G AI,
 * making them available for FDC Web2Json attestation.
 * 
 * Flow:
 * 1. User submits insurance request
 * 2. 0G LLM generates quote
 * 3. Quote is stored with unique ID
 * 4. FDC can attest to this data via Web2Json
 * 
 * POST /api/insurance/quote - Generate new quote
 * GET /api/insurance/quote?id=<quoteId> - Retrieve quote for FDC attestation
 */

// Redis client for persistent storage
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL not configured');
    }
    
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

const storage = {
  async set(key: string, value: any) {
    const client = await getRedisClient();
    await client.set(key, JSON.stringify(value), { EX: 86400 }); // 24 hour expiry
    return 'OK';
  },
  async get(key: string) {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  }
};

interface InsuranceQuote {
  id: string;
  requesterAddress: string;
  timestamp: number;
  userInput: string;
  aiResponse: string;
  premium: number; // in wei or smallest unit
  coverageAmount: number;
  validUntil: number;
  riskScore: number; // 0-100
  metadata: {
    model: string;
    provider: string;
    chatId?: string;
  };
}

/**
 * POST - Generate new insurance quote using 0G AI
 */
export async function POST(request: NextRequest) {
  try {
    const { userInput, requesterAddress } = await request.json();

    if (!userInput || !requesterAddress) {
      return NextResponse.json(
        { error: 'userInput and requesterAddress are required' },
        { status: 400 }
      );
    }

    console.log('📝 Generating insurance quote for:', requesterAddress);

    // Use specialized insurance advisor system prompt
    const systemPrompt = getSystemPrompt('policyAdvisor');

    // Enhanced prompt to get structured insurance data
    const enhancedPrompt = `${userInput}

Based on the above request, provide a detailed insurance quote with:
1. Recommended coverage amount (in USD)
2. Annual premium (in USD)
3. Risk assessment score (0-100, where 0 is lowest risk)
4. Coverage duration (in months)
5. Key coverage details

Format your response as a clear insurance quote that includes all pricing details.`;

    // Default to Llama 70B for insurance quotes
    const provider = process.env.PROVIDER_LLAMA_70B || OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];

    // Generate quote using 0G AI
    const result = await brokerService.sendQuery(provider, enhancedPrompt, {
      systemPrompt,
      responseFormat: 'default', // Full response for insurance quotes
      temperature: 0.5, // Lower temperature for more consistent quotes
      maxTokens: 2000
    });

    if (!result.content) {
      throw new Error('Failed to generate insurance quote');
    }

    // Parse the AI response to extract structured data
    const parsedQuote = parseInsuranceQuote(result.content);

    // Generate unique quote ID
    const quoteId = generateQuoteId(requesterAddress);

    // Create quote object
    const quote: InsuranceQuote = {
      id: quoteId,
      requesterAddress,
      timestamp: Date.now(),
      userInput,
      aiResponse: result.content,
      premium: parsedQuote.premium,
      coverageAmount: parsedQuote.coverageAmount,
      validUntil: Date.now() + (24 * 60 * 60 * 1000), // Valid for 24 hours
      riskScore: parsedQuote.riskScore,
      metadata: {
        model: result.metadata?.model || 'llama-3.3-70b-instruct',
        provider: result.metadata?.provider || provider,
        chatId: result.metadata?.chatId
      }
    };

    await storage.set(`quote:${quoteId}`, quote);

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        premium: quote.premium.toString(),
        coverageAmount: quote.coverageAmount.toString(),
        riskScore: quote.riskScore,
        validUntil: quote.validUntil,
        response: quote.aiResponse
      },
      // URL for FDC attestation (ensure no double slashes)
      fdcUrl: `${(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/insurance/quote?id=${quoteId}`
    });

  } catch (error) {
    const err = error as Error;
    console.error('❌ Quote Generation Error:', err);

    return NextResponse.json(
      {
        error: 'Failed to generate insurance quote',
        message: err.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve quote for FDC Web2Json attestation
 * 
 * This endpoint returns quote data in a format suitable for FDC attestation.
 * FDC verifiers will call this endpoint to collect verifiable insurance quote data.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quoteId = searchParams.get('id');

    if (!quoteId) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const quote = await storage.get(`quote:${quoteId}`) as InsuranceQuote | null;

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found or expired' },
        { status: 404 }
      );
    }

    // Check if quote is still valid
    if (Date.now() > quote.validUntil) {
      return NextResponse.json(
        { error: 'Quote has expired' },
        { status: 410 }
      );
    }

    // Return data in format suitable for FDC Web2Json attestation
    const response = NextResponse.json({
      quoteId: quote.id,
      requesterAddress: quote.requesterAddress,
      timestamp: quote.timestamp,
      premium: quote.premium.toString(), // Convert to string for large numbers
      coverageAmount: quote.coverageAmount.toString(), // Convert to string for large numbers
      riskScore: quote.riskScore,
      validUntil: quote.validUntil,
      // Include AI metadata for transparency
      aiProvider: quote.metadata.provider,
      aiModel: quote.metadata.model,
      // Hash of full response for verification
      responseHash: hashString(quote.aiResponse)
    });

    // Add CORS headers for FDC verifier access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    const err = error as Error;
    console.error('❌ Quote Retrieval Error:', err);

    return NextResponse.json(
      {
        error: 'Failed to retrieve quote',
        message: err.message
      },
      { status: 500 }
    );
  }
}

/**
 * Parse AI response to extract structured insurance data
 */
function parseInsuranceQuote(aiResponse: string): {
  premium: number;
  coverageAmount: number;
  riskScore: number;
} {
  // Extract numbers from AI response
  // This is a simple parser - you may want to enhance it based on your AI's response format
  
  const premiumMatch = aiResponse.match(/premium[:\s]+\$?[\d,]+\.?\d*/i);
  const coverageMatch = aiResponse.match(/coverage[:\s]+\$?[\d,]+\.?\d*/i);
  const riskMatch = aiResponse.match(/risk[:\s]+(\d+)/i);

  // Extract and convert to numbers (removing $ and commas)
  const premium = premiumMatch 
    ? parseFloat(premiumMatch[0].replace(/[^0-9.]/g, '')) * 1e18 // Convert to wei
    : 1000 * 1e18; // Default 1000 USD

  const coverageAmount = coverageMatch
    ? parseFloat(coverageMatch[0].replace(/[^0-9.]/g, '')) * 1e18
    : 50000 * 1e18; // Default 50k USD

  const riskScore = riskMatch
    ? parseInt(riskMatch[1])
    : 50; // Default medium risk

  return {
    premium,
    coverageAmount,
    riskScore: Math.min(100, Math.max(0, riskScore)) // Clamp 0-100
  };
}

/**
 * Generate unique quote ID
 */
function generateQuoteId(requesterAddress: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `quote_${requesterAddress.slice(2, 10)}_${timestamp}_${random}`;
}

/**
 * Simple hash function for response verification
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

