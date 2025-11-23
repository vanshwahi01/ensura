/**
 * Check Entropy Signer Wallet Balance
 * Run: node scripts/check-entropy-balance.js
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkBalance() {
  console.log('💰 Checking Entropy Signer Wallet Balance...\n');
  
  const privateKey = process.env.ENTROPY_SIGNER_PRIVATE_KEY;
  const rpcUrl = process.env.FLARE_RPC_URL || 'https://coston2-api.flare.network/ext/C/rpc';
  
  if (!privateKey) {
    console.error('❌ Error: ENTROPY_SIGNER_PRIVATE_KEY not found in .env.local');
    console.log('\n📝 Please add to .env.local:');
    console.log('   ENTROPY_SIGNER_PRIVATE_KEY=0xYourPrivateKeyHere\n');
    process.exit(1);
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('━'.repeat(80));
    console.log('📍 Wallet Address:', wallet.address);
    console.log('🌐 Network:', rpcUrl.includes('coston2') ? 'Flare Coston2 (Testnet)' : 'Flare Mainnet');
    console.log('━'.repeat(80));
    
    // Get balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInFLR = ethers.formatEther(balance);
    
    console.log('\n💰 Balance:', balanceInFLR, 'FLR');
    
    // Check if balance is sufficient
    const minRequired = 0.01; // 0.01 FLR minimum for a few entropy requests
    const balanceNum = parseFloat(balanceInFLR);
    
    if (balanceNum < minRequired) {
      console.log('\n⚠️  LOW BALANCE WARNING');
      console.log(`   Current: ${balanceNum} FLR`);
      console.log(`   Minimum: ${minRequired} FLR`);
      console.log('\n📍 Get testnet FLR:');
      console.log('   1. Visit: https://faucet.flare.network');
      console.log('   2. Select: Coston2 Testnet');
      console.log(`   3. Enter: ${wallet.address}`);
      console.log('   4. Request tokens\n');
    } else {
      console.log('✅ Balance is sufficient for Pyth Entropy requests');
      console.log(`   Estimated requests possible: ~${Math.floor(balanceNum / 0.001)} requests\n`);
    }
    
    // Get latest block to verify connection
    const blockNumber = await provider.getBlockNumber();
    console.log('🔗 Latest Block:', blockNumber);
    console.log('✅ RPC Connection: Working\n');
    
    // Calculate Pyth Entropy fee
    try {
      const ENTROPY_ABI = ['function getFee(address provider) external view returns (uint128 fee)'];
      const entropyAddress = process.env.NEXT_PUBLIC_PYTH_ENTROPY_ADDRESS || '0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF';
      const providerAddress = process.env.ENTROPY_PROVIDER || '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344';
      
      const entropyContract = new ethers.Contract(entropyAddress, ENTROPY_ABI, provider);
      const fee = await entropyContract.getFee(providerAddress);
      const feeInFLR = ethers.formatEther(fee);
      
      console.log('🎲 Pyth Entropy Fee:', feeInFLR, 'FLR per request');
      console.log(`   Requests possible with current balance: ~${Math.floor(balanceNum / parseFloat(feeInFLR))}\n`);
    } catch (error) {
      console.log('⚠️  Could not fetch Pyth Entropy fee (contract may not be available)\n');
    }
    
    console.log('━'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('━'.repeat(80));
    console.log(`Address: ${wallet.address}`);
    console.log(`Balance: ${balanceInFLR} FLR`);
    console.log(`Status: ${balanceNum >= minRequired ? '✅ Ready' : '⚠️  Needs funding'}`);
    console.log('━'.repeat(80));
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBalance();

