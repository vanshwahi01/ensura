import { NextRequest, NextResponse } from 'next/server';
import { brokerService } from '@/lib/brokerService';

export async function GET(request: NextRequest) {
  try {
    // Access the broker directly
    const broker = (brokerService as any).broker;
    const wallet = (brokerService as any).wallet;
    
    if (!broker || !wallet) {
      return NextResponse.json(
        { error: 'Broker not initialized' },
        { status: 500 }
      );
    }

    console.log("🔍 Running full diagnostic...");

    // Get ledger account
    const ledger = await broker.ledger.getLedger();
    
    // Convert BigInts to strings for JSON
    const sanitize = (obj: any): any => {
      if (typeof obj === 'bigint') {
        return obj.toString();
      } else if (Array.isArray(obj)) {
        return obj.map(sanitize);
      } else if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
          result[key] = sanitize(obj[key]);
        }
        return result;
      }
      return obj;
    };

    const ledgerData = sanitize(ledger);
    console.log("📋 Full ledger data:", JSON.stringify(ledgerData, null, 2));

    // Try to get provider accounts
    const providers = [
      { name: "llama-3.3-70b", address: "0xf07240Efa67755B5311bc75784a061eDB47165Dd" },
      { name: "deepseek-r1-70b", address: "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3" },
      { name: "qwen2.5-vl-72b", address: "0x6D233D2610c32f630ED53E8a7Cbf759568041f8f" }
    ];

    const providerAccounts: any[] = [];
    for (const prov of providers) {
      try {
        const account = await broker.ledger.getAccount(prov.address, "inference");
        const accountData = sanitize(account);
        providerAccounts.push({
          provider: prov.name,
          address: prov.address,
          account: accountData
        });
      } catch (error: any) {
        providerAccounts.push({
          provider: prov.name,
          address: prov.address,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      walletAddress: wallet.address,
      ledger: ledgerData,
      providerAccounts,
      interpretation: {
        totalBalance: "Total funds in the ledger system",
        balance: "Available balance (unlocked and ready to use)",
        difference: "If totalBalance > balance, funds may be locked or allocated"
      },
      recommendations: ledgerData.balance === '0' && parseFloat(ledgerData.totalBalance || '0') > 0
        ? [
            "Your funds exist in the ledger but show as unavailable (balance=0, totalBalance>0)",
            "This usually means funds are in a locked/allocated state",
            "Possible causes: 1) Pending transaction, 2) Funds allocated to provider but not yet transferred, 3) SDK state issue",
            "Try getting more tokens from https://faucet.0g.ai to continue"
          ]
        : []
    });
  } catch (error: any) {
    console.error("❌ Diagnostic error:", error);
    return NextResponse.json(
      {
        error: 'Diagnostic failed',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

