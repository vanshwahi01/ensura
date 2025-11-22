import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

async function getBroker() {
  const provider = new ethers.JsonRpcProvider(
    process.env.OG_NETWORK_RPC || 'https://evmrpc-testnet.0g.ai'
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  return await createZGComputeNetworkBroker(wallet);
}

export async function POST(request: NextRequest) {
  try {
    const { action, providerAddress, amount } = await request.json();
    const broker = await getBroker();

    switch (action) {
      case 'getWalletInfo':
        const provider = new ethers.JsonRpcProvider(
          process.env.OG_NETWORK_RPC || 'https://evmrpc-testnet.0g.ai'
        );
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        const walletAddress = wallet.address;
        const walletBalance = await provider.getBalance(walletAddress);
        return NextResponse.json({
          success: true,
          address: walletAddress,
          balance: ethers.formatEther(walletBalance),
          balanceOG: ethers.formatEther(walletBalance) + ' OG',
          network: process.env.OG_NETWORK_RPC || 'https://evmrpc-testnet.0g.ai'
        });

      case 'checkBalance':
        const account = await broker.ledger.getLedger();
        return NextResponse.json({ 
          success: true,
          ledgerBalance: ethers.formatEther(account.balance),
          totalBalance: ethers.formatEther(account.totalBalance)
        });

      case 'acknowledgeProvider':
        if (!providerAddress) {
          return NextResponse.json(
            { error: 'providerAddress required' },
            { status: 400 }
          );
        }
        const tx = await broker.inference.acknowledgeProviderSigner(
          providerAddress
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Provider acknowledged',
          transaction: tx
        });

        case 'transferToProvider':
            if (!providerAddress) {
              return NextResponse.json(
                { error: 'providerAddress required' },
                { status: 400 }
              );
            }
            const transferAmt = amount || 2;
            // Transfer from your ledger balance to the provider's account
            const transferTx = await broker.ledger.transferFund(
              providerAddress,
              'inference',
              ethers.parseEther(transferAmt.toString())
            );
            return NextResponse.json({
              success: true,
              message: `Transferred ${transferAmt} OG to provider`,
              transaction: transferTx
            });

        case 'addFunds':
            const depositAmount = amount || 2;
            await broker.ledger.depositFund(depositAmount); // Use depositFund per official docs
            return NextResponse.json({
              success: true,
              message: `Added ${depositAmount} OG to ledger`
            });

        case 'addLedger':
        const addAmount = amount || 100;
        await broker.ledger.addLedger(addAmount); // For initial account creation
        return NextResponse.json({
            success: true,
            message: `Created ledger with ${addAmount} OG`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Setup Error:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    );
  }
}