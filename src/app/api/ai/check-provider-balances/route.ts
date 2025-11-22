import { NextRequest, NextResponse } from 'next/server';
import { brokerService } from '@/lib/brokerService';

export async function GET(request: NextRequest) {
  try {
    // Get the broker instance
    const broker = (brokerService as any).broker;
    if (!broker) {
      return NextResponse.json(
        { error: 'Broker not initialized' },
        { status: 500 }
      );
    }

    const providers = [
      { name: "llama-3.3-70b", address: "0xf07240Efa67755B5311bc75784a061eDB47165Dd" },
      { name: "deepseek-r1-70b", address: "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3" },
      { name: "qwen2.5-vl-72b", address: "0x6D233D2610c32f630ED53E8a7Cbf759568041f8f" }
    ];

    const balances = [];

    for (const prov of providers) {
      try {
        const account = await broker.ledger.getAccount(prov.address, "inference");
        const balance = (account as any).balance || (account as any)[0] || BigInt(0);
        
        if (balance > 0) {
          const { ethers } = await import('ethers');
          balances.push({
            name: prov.name,
            address: prov.address,
            balance: ethers.formatEther(balance),
            balanceOG: `${ethers.formatEther(balance)} OG`,
            canRefund: true
          });
        }
      } catch (error: any) {
        // Provider has no balance, skip
      }
    }

    return NextResponse.json({
      success: true,
      providerBalances: balances,
      message: balances.length > 0 
        ? 'You have funds allocated to providers that can be refunded!' 
        : 'No funds found with providers'
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to check provider balances',
        message: error.message
      },
      { status: 500 }
    );
  }
}

