import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import OpenAI from 'openai';

// Initialize broker (singleton pattern)
let broker: any = null;

async function getBroker() {
    if (!broker) {
      const provider = new ethers.JsonRpcProvider(
        process.env.OG_NETWORK_RPC || 'https://evmrpc-testnet.0g.ai'
      );
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
      broker = await createZGComputeNetworkBroker(wallet);
      
      // Check if ledger exists, if not create one
      try {
        // Use getLedger() instead of listAccounts()
        const account = await broker.ledger.getLedger();
        console.log(`Ledger balance: ${ethers.formatEther(account.balance)} 0G`);
        
        // Check if balance is too low
        if (account.balance < ethers.parseEther("0.1")) {
          console.log('Balance low, adding more funds...');
          await broker.ledger.depositFund(0.5); // Add 0.5 OG tokens
        }
      } catch (error: any) {
        // If account doesn't exist, create it
        if (error.message?.includes('AccountNotExists') || error.code === 'CALL_EXCEPTION') {
          console.log('Creating ledger account with 0.5 OG...');
          await broker.ledger.addLedger(0.5); // Initial funding
          console.log('Ledger created successfully!');
        } else {
          console.error('Error checking ledger:', error);
        }
      }
    }
    return broker;
}

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
    const provider = providerAddress || process.env.PROVIDER_LLAMA_70B;

    // Get broker instance
    const brokerInstance = await getBroker();

    // Get service metadata and headers
    const { endpoint, model: serviceModel } =
      await brokerInstance.inference.getServiceMetadata(provider);
    const headers = await brokerInstance.inference.getRequestHeaders(
      provider,
      prompt
    );

    // Create OpenAI client with 0G endpoint
    const openai = new OpenAI({
      baseURL: endpoint,
      apiKey: '', // Not needed for 0G
      defaultHeaders: headers,
    });

    // Send query
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model || serviceModel,
    });

    const responseContent = completion.choices[0].message.content;

    // Verify and process response
    const isValid = await brokerInstance.inference.processResponse(
      provider,
      responseContent,
      completion.id
    );

    return NextResponse.json({
      success: true,
      response: responseContent,
      verified: isValid,
      model: serviceModel,
      provider: provider,
    });

  } catch (error: any) {
    console.error('0G Query Error:', error);
    // Handle specific errors
    if (error.message?.includes('acknowledge')) {
      return NextResponse.json(
        {
          error: 'Provider not acknowledged',
          message: 'Please acknowledge the provider first',
          code: 'PROVIDER_NOT_ACKNOWLEDGED'
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('insufficient')) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          message: 'Please add funds to your ledger account',
          code: 'INSUFFICIENT_BALANCE'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to query AI', details: error.message },
      { status: 500 }
    );
  }
}