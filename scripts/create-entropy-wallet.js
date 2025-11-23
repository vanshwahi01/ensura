/**
 * Create a new wallet for Pyth Entropy signing
 * Run: npm run entropy:create-wallet
 */

import { ethers } from 'ethers';

async function main() {
  console.log('🔑 Creating new wallet for Pyth Entropy signing...\n');
  
  // Create random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('✅ Wallet Created!\n');
  console.log('━'.repeat(80));
  console.log('📍 Address:     ', wallet.address);
  console.log('🔐 Private Key: ', wallet.privateKey);
  console.log('━'.repeat(80));
  
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('   1. NEVER commit this private key to git');
  console.log('   2. NEVER share this private key with anyone');
  console.log('   3. This wallet is for TESTNET ONLY');
  console.log('   4. Use a different wallet for mainnet\n');
  
  console.log('📝 Next Steps:');
  console.log('   1. Add private key to .env.local:');
  console.log(`      ENTROPY_SIGNER_PRIVATE_KEY=${wallet.privateKey}\n`);
  console.log('   2. Fund wallet with testnet FLR:');
  console.log('      Visit: https://faucet.flare.network');
  console.log(`      Address: ${wallet.address}\n`);
  console.log('   3. Verify balance:');
  console.log('      npm run entropy:check-balance\n');
  
  // Generate mnemonic for backup
  console.log('💾 Backup Mnemonic (store securely):');
  console.log('   ', wallet.mnemonic.phrase);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

