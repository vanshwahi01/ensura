import { NextRequest, NextResponse } from 'next/server';
import { brokerService, OFFICIAL_PROVIDERS } from '@/lib/brokerService';

export async function POST(request: NextRequest) {
  try {
    const { prompt, providerAddress, model } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Default to Llama 70B if no provider specified
    const provider = providerAddress || 
                    process.env.PROVIDER_LLAMA_70B ||
                    OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];

    console.log(`📤 Query request for provider: ${provider}`);

    // Send query (auto-handles all setup)
    const result = await brokerService.sendQuery(provider, prompt, { model });

    return NextResponse.json({
      success: true,
      response: result.content,
      metadata: result.metadata,
    });

  } catch (error) {
    const err = error as Error;
    console.error('❌ Query Error:', err);
    
    // Handle specific errors with helpful messages
    if (err.message?.includes('acknowledge')) {
      return NextResponse.json(
        {
          error: 'Provider not acknowledged',
          message: 'Please acknowledge the provider first (usually auto-handled)',
          details: err.message,
          code: 'PROVIDER_NOT_ACKNOWLEDGED'
        },
        { status: 400 }
      );
    }

    if (err.message?.includes('insufficient') || err.message?.includes('Insufficient')) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          message: 'Please add funds to your wallet or ledger account',
          details: err.message,
          faucet: 'https://faucet.0g.ai',
          code: 'INSUFFICIENT_BALANCE'
        },
        { status: 400 }
      );
    }

    if (err.message?.includes('PRIVATE_KEY')) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: 'PRIVATE_KEY not set in environment variables',
          details: err.message,
          code: 'CONFIG_ERROR'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to query AI',
        message: err.message,
        details: err.stack
      },
      { status: 500 }
    );
  }
}
