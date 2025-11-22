import { NextRequest, NextResponse } from 'next/server';
import { brokerService, OFFICIAL_PROVIDERS } from '@/lib/brokerService';

export async function POST(request: NextRequest) {
  try {
    const { action, providerAddress, amount } = await request.json();

    switch (action) {
      case 'getWalletInfo':
        const walletInfo = await brokerService.getWalletInfo();
        return NextResponse.json({
          success: true,
          ...walletInfo
        });

      case 'checkBalance':
        const balance = await brokerService.getBalance();
        return NextResponse.json({
          success: true,
          ledgerBalance: balance.balance,
          totalBalance: balance.totalBalance,
          ledgerAddress: balance.address
        });

      case 'acknowledgeProvider':
        if (!providerAddress) {
          return NextResponse.json(
            { error: 'providerAddress required' },
            { status: 400 }
          );
        }
        const ackResult = await brokerService.acknowledgeProvider(providerAddress);
        return NextResponse.json({
          success: true,
          message: ackResult
        });

      case 'transferToProvider':
        if (!providerAddress) {
          return NextResponse.json(
            { error: 'providerAddress required' },
            { status: 400 }
          );
        }
        const transferAmt = amount || 0.1;
        const transferResult = await brokerService.transferFundsToProvider(
          providerAddress,
          transferAmt
        );
        return NextResponse.json({
          success: true,
          message: transferResult,
          note: 'Each provider requires minimum 0.1 OG to start (1.5 OG recommended)'
        });

      case 'addFunds':
        const depositAmount = amount || 0.1;
        const depositResult = await brokerService.depositFunds(depositAmount);
        return NextResponse.json({
          success: true,
          message: depositResult
        });

      case 'addLedger':
        const addAmount = amount || 0.5;
        const addResult = await brokerService.addFundsToLedger(addAmount);
        return NextResponse.json({
          success: true,
          message: addResult,
          note: 'Transaction submitted. Balance may take a few seconds to reflect.'
        });

      case 'listServices':
        const services = await brokerService.listServices();
        return NextResponse.json({
          success: true,
          services,
          count: services.length
        });

      case 'refund':
        if (!providerAddress || !amount) {
          return NextResponse.json(
            { error: 'providerAddress and amount required for refund' },
            { status: 400 }
          );
        }
        const refundResult = await brokerService.requestRefund(providerAddress, amount);
        return NextResponse.json({
          success: true,
          message: refundResult
        });

      case 'diagnose':
        const diagnostic = await brokerService.getDiagnostics();
        return NextResponse.json({
          success: true,
          ...diagnostic
        });

      case 'checkProviderBalances':
        const providerBalances = await brokerService.getProviderBalances();
        return NextResponse.json({
          success: true,
          providerBalances: providerBalances.balances,
          message: providerBalances.message
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: getWalletInfo, checkBalance, acknowledgeProvider, transferToProvider, addFunds, addLedger, listServices, refund, diagnose, checkProviderBalances' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('❌ Setup Error:', error);
    return NextResponse.json(
      {
        error: 'Setup failed',
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}
