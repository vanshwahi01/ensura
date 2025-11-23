/**
 * Script to check all balances and diagnose where funds went
 * Run with: npx ts-node check-balances.ts
 */

import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
dotenv.config();

async function checkBalances() {
  try {
    console.log("🔍 Checking all balances...\n");

    // Initialize
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in .env');
    }

    const provider = new ethers.JsonRpcProvider(
      process.env.OG_NETWORK_RPC || "https://evmrpc-testnet.0g.ai"
    );
    const wallet = new ethers.Wallet(privateKey, provider);
    const broker = await createZGComputeNetworkBroker(wallet);

    console.log('📍 Wallet Address: ${wallet.address}\n');

    // 1. Check wallet balance
    const walletBalance = await provider.getBalance(wallet.address);
    console.log("💰 WALLET BALANCE:");
    console.log('   ${ethers.formatEther(walletBalance)} OG');
    console.log();

    // 2. Check ledger balance
    try {
      const ledgerAccount = await broker.ledger.getLedger();
      console.log("📊 LEDGER ACCOUNT:");
      console.log('   Raw data:', JSON.stringify(ledgerAccount, (_, v) => typeof v === 'bigint' ? v.toString() : v));
      
      const balance = (ledgerAccount as any).balance || (ledgerAccount as any)[0] || BigInt(0);
      const balanceOG = typeof balance === 'bigint' ? ethers.formatEther(balance) : '0';
      console.log('   Balance: ${balanceOG} OG');
      console.log();
    } catch (error: any) {
      console.log("❌ LEDGER ACCOUNT: Not found or error:", error.message);
      console.log();
    }

    // 3. Check provider-specific balances
    const providers = [
      { name: "llama-3.3-70b", address: "0xf07240Efa67755B5311bc75784a061eDB47165Dd" },
      { name: "deepseek-r1-70b", address: "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3" },
      { name: "qwen2.5-vl-72b", address: "0x6D233D2610c32f630ED53E8a7Cbf759568041f8f" }
    ];

    console.log("🔗 PROVIDER ACCOUNT BALANCES:");
    for (const prov of providers) {
      try {
        const account = await broker.ledger.getLedger();
        const balance = (account as any).balance || (account as any)[0] || BigInt(0);
        const balanceOG = typeof balance === 'bigint' ? ethers.formatEther(balance) : '0';
        
        if (parseFloat(balanceOG) > 0) {
          console.log('   ✅ ${prov.name}:');
          console.log('      Address: ${prov.address}');
          console.log('      Balance: ${balanceOG} OG');
          console.log('      💡 You can request a refund for this amount!');
          console.log();
        }
      } catch (error: any) {
        // Skip providers with no balance
      }
    }

    // Summary
    console.log("\n📋 SUMMARY:");
    console.log("   If you have funds in the ledger, they're safe and ready to use.");
    console.log("   If you have funds with a provider, you can request a refund.");
    console.log("   To request a refund, use: POST /api/ai/setup");
    console.log('   Body: { "action": "refund", "providerAddress": "0x...", "amount": X }');

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }
}

checkBalances();

