import { NextRequest, NextResponse } from 'next/server';
import { brokerService, OFFICIAL_PROVIDERS } from '@/lib/brokerService';
import { DEFAULT_AI_CONFIG, getSystemPrompt } from '@/lib/aiConfig';

/**
 * Enhanced AI Query Endpoint for Ensura Insurance dApp
 * 
 * Defaults to concise responses with insurance-focused system prompt.
 * 
 * Supports:
 * - System prompts for custom behavior (defaults to Ensura insurance advisor)
 * - Response formatting (JSON, concise, default) - defaults to 'concise'
 * - Temperature and max tokens control
 * - Automatic provider setup and fund management
 * 
 * Example request body:
 * {
 *   "prompt": "What is Ensura?",
 *   "responseFormat": "concise",  // optional: 'json', 'concise', or 'default' (defaults to 'concise')
 *   "systemPromptType": "default",  // optional: 'default', 'riskAssessment', 'policyAdvisor', 'support', 'technical'
 *   "systemPrompt": "Custom prompt...",  // optional: override with custom prompt
 *   "providerAddress": "0x...",  // optional, defaults to llama-3.3-70b
 *   "model": "llama-3.3-70b-instruct",  // optional
 *   "temperature": 0.7,  // optional (0-2)
 *   "maxTokens": 500  // optional
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      providerAddress, 
      model,
      systemPrompt,
      systemPromptType,
      responseFormat,
      temperature,
      maxTokens
    } = await request.json();

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate response format if provided
    if (responseFormat && !['json', 'concise', 'default'].includes(responseFormat)) {
      return NextResponse.json(
        { 
          error: 'Invalid responseFormat',
          message: 'responseFormat must be "json", "concise", or "default"'
        },
        { status: 400 }
      );
    }

    // Validate temperature if provided
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      return NextResponse.json(
        { 
          error: 'Invalid temperature',
          message: 'temperature must be between 0 and 2'
        },
        { status: 400 }
      );
    }

    // Default to Llama 70B if no provider specified
    const provider = providerAddress || 
                    process.env.PROVIDER_LLAMA_70B ||
                    OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];

    // Use default config values if not provided
    const finalResponseFormat = responseFormat || DEFAULT_AI_CONFIG.responseFormat;
    const finalTemperature = temperature ?? DEFAULT_AI_CONFIG.temperature;
    const finalMaxTokens = maxTokens || DEFAULT_AI_CONFIG.maxTokens;
    
    // Determine system prompt (priority: custom > type > default)
    const finalSystemPrompt = systemPrompt || 
                              (systemPromptType ? getSystemPrompt(systemPromptType as any) : undefined) ||
                              DEFAULT_AI_CONFIG.systemPrompt;

    console.log(`📤 Query request for provider: ${provider}`);
    console.log(`🎨 Response format: ${finalResponseFormat}`);
    if (systemPromptType) console.log(`⚙️  System prompt type: ${systemPromptType}`);
    if (systemPrompt) console.log(`⚙️  Custom system prompt provided`);

    // Send query with all options (auto-handles provider setup)
    const result = await brokerService.sendQuery(provider, prompt, {
      model,
      systemPrompt: finalSystemPrompt,
      responseFormat: finalResponseFormat as 'json' | 'concise' | 'default',
      temperature: finalTemperature,
      maxTokens: finalMaxTokens
    });

    // Parse JSON responses if format is JSON
    let parsedContent = result.content;
    if (finalResponseFormat === 'json' && result.content) {
      try {
        parsedContent = JSON.parse(result.content);
      } catch (e) {
        console.warn('⚠️  Response was not valid JSON despite json format request');
      }
    }

    return NextResponse.json({
      success: true,
      response: parsedContent,
      metadata: {
        ...result.metadata,
        requestFormat: finalResponseFormat,
        systemPromptType: systemPromptType || 'default',
        usedDefaultConfig: !systemPrompt && !systemPromptType && !responseFormat,
        temperature: finalTemperature,
        maxTokens: finalMaxTokens
      },
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
