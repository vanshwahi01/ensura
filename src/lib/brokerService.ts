import { ethers } from "ethers";
import { createZGComputeNetworkBroker, ZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";

/**
 * Official 0G Compute Network Providers
 * From: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/sdk
 */
export const OFFICIAL_PROVIDERS = {
  "llama-3.3-70b-instruct": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
  "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3",
  "qwen2.5-vl-72b-instruct": "0x6D233D2610c32f630ED53E8a7Cbf759568041f8f"
};

/**
 * 0G Compute Network Broker Service
 * 
 * Manages AI inference requests through the 0G Compute Network.
 * Handles:
 * - Wallet and ledger account management
 * - Provider acknowledgment and fund transfers
 * - AI query routing with custom system prompts
 * - Response formatting (JSON, concise, default)
 * - Automatic provider setup and balance management
 */
class BrokerService {
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private broker: ZGComputeNetworkBroker | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private acknowledgedProviders = new Set<string>();

  constructor() {
    // Initialize on first access
    this.initPromise = this.initialize();
  }

  /**
   * Helper to parse account balance from SDK response
   * SDK returns either array format [address, balance, totalBalance, ...] 
   * or object format { address, balance, totalBalance, ... }
   */
  private parseAccountBalance(account: any): {
    address: string;
    balance: bigint;
    totalBalance: bigint;
  } {
    if (Array.isArray(account)) {
      return {
        address: account[0] || 'N/A',
        balance: BigInt(account[1] || 0),
        totalBalance: BigInt(account[2] || 0)
      };
    } else {
      return {
        address: account.address || 'N/A',
        balance: account.balance || BigInt(0),
        totalBalance: account.totalBalance || BigInt(0)
      };
    }
  }

  private async initialize(): Promise<void> {
    try {
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY is required in .env file');
      }

      this.provider = new ethers.JsonRpcProvider(
        process.env.OG_NETWORK_RPC || "https://evmrpc-testnet.0g.ai"
      );
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.broker = await createZGComputeNetworkBroker(this.wallet);

      console.log("✅ Broker service initialized with wallet:", this.wallet.address);

      // Auto-setup: Check and create/fund ledger if needed
      try {
        await this.ensureLedgerExists();
      } catch (ledgerError: any) {
        console.error("⚠️  Ledger setup failed during initialization:", ledgerError.message);
        console.log("💡 You can manually fund the ledger using the /api/ai/setup endpoint with action 'addLedger'");
        // Don't throw - allow initialization to complete, ledger can be funded later
      }

      this.initialized = true;
    } catch (error: any) {
      console.error("❌ Failed to initialize broker service:", error.message);
      throw error;
    }
  }

  /**
   * Ensures ledger account exists, creates if needed
   * Automatically called during initialization
   */
  private async ensureLedgerExists(): Promise<void> {
    if (!this.broker || !this.wallet || !this.provider) {
      throw new Error("Broker not initialized");
    }

    try {
      // Check if ledger exists
      const account = await this.broker.ledger.getLedger();
      const { balance, totalBalance } = this.parseAccountBalance(account);

      const balanceNum = parseFloat(ethers.formatEther(balance));
      const totalBalanceNum = parseFloat(ethers.formatEther(totalBalance));

      console.log('💰 Ledger balance: ${balanceNum.toFixed(4)} OG (Total: ${totalBalanceNum.toFixed(4)} OG)');

      // Check if we need to fund the account
      if (balanceNum === 0 && totalBalanceNum === 0) {
        // Account exists but has no funds at all - need to deposit funds
        console.log("📊 Ledger exists but has 0 balance, depositing funds now...");
        await this.fundExistingLedger();
      } else if (balanceNum < 1.5) {
        if (totalBalanceNum > balanceNum) {
          console.log(`⚠️  You have ${totalBalanceNum.toFixed(4)} OG total, but only ${balanceNum.toFixed(4)} OG available. Some funds may be allocated/locked.`);
        } else {
          console.log(`⚠️  Low ledger balance (${balanceNum.toFixed(4)} OG), consider adding more funds for optimal usage`);
        }
      } else {
        console.log('✅ Ledger has sufficient balance: ${balanceNum.toFixed(4)} OG');
      }
    } catch (error: any) {
      // If account doesn't exist at all, create it with addLedger
      if (error.message?.includes('AccountNotExists') || 
          error.code === 'CALL_EXCEPTION' ||
          error.message?.includes('account does not exist')) {
        console.log("📊 Ledger doesn't exist, creating now...");
        await this.createNewLedger();
      } else {
        console.error("❌ Error checking ledger:", error.message);
        throw error;
      }
    }
  }

  /**
   * Creates a NEW ledger account (use only when account doesn't exist)
   * Uses addLedger() which creates a new ledger with initial balance
   */
  private async createNewLedger(): Promise<void> {
    if (!this.broker || !this.wallet || !this.provider) {
      throw new Error("Broker not initialized");
    }

    // Check wallet balance first
    const walletBalance = await this.provider.getBalance(this.wallet.address);
    const availableOG = parseFloat(ethers.formatEther(walletBalance));

    console.log(`💰 Wallet balance: ${availableOG.toFixed(4)} OG`);

    // Calculate how much we can safely use (leave 0.02 for gas - transactions are cheap on 0G)
    const gasReserve = 0.02;
    const maxLedgerAmount = Math.max(0, availableOG - gasReserve);

    // Minimum recommended by 0G is 1.5 OG
    const minRecommended = 1.5;

    if (maxLedgerAmount < 0.1) {
      throw new Error(
        'Insufficient wallet balance. You have ${availableOG.toFixed(4)} OG but need at least 0.12 OG (0.1 for ledger + 0.02 for gas). ' +
        'Get more testnet tokens from https://faucet.0g.ai'
      );
    }

    if (maxLedgerAmount < minRecommended) {
      console.log('⚠️  Warning: Wallet has ${availableOG.toFixed(4)} OG. Recommended: ${minRecommended} OG or more for optimal usage.');
    }

    // Use most of what we have, but cap at 10 OG to keep some in wallet for future operations
    const ledgerAmount = Math.min(maxLedgerAmount, 10);
    console.log('🔨 Funding ledger with ${ledgerAmount.toFixed(4)} OG (leaving ${gasReserve.toFixed(2)} OG for gas)...');

    try {
      // addLedger() creates a NEW ledger account (fails if account exists)
      await this.broker.ledger.addLedger(ledgerAmount);
      console.log("✅ New ledger created successfully!");

      // Wait for blockchain confirmation (0G is fast, but give it a moment)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the ledger balance
      try {
        const newAccount = await this.broker.ledger.getLedger();
        const { balance: newBalance } = this.parseAccountBalance(newAccount);
        if (newBalance) {
          const finalBalance = ethers.formatEther(newBalance);
          console.log(`✅ Ledger balance confirmed: ${finalBalance} OG`);
          
          if (newBalance < ethers.parseEther("1.0")) {
            console.log("⚠️  Note: Balance is below 1 OG. You may need to add more for multiple queries.");
          }
        } else {
          console.log("⚠️  Ledger created but balance verification pending...");
        }
      } catch (verifyError) {
        console.log("⚠️  Ledger created but verification pending (this is normal)");
      }
    } catch (createError: any) {
      if (createError.code === 'INSUFFICIENT_FUNDS') {
        throw new Error(
          'Insufficient funds in wallet (${availableOG.toFixed(4)} OG). Get testnet tokens from: https://faucet.0g.ai'
        );
      }
      throw new Error('Failed to create new ledger: ${createError.message}');
    }
  }

  /**
   * Deposits funds to an EXISTING ledger account (use when account exists but needs more funds)
   * Uses depositFund() which adds to existing balance
   */
  private async fundExistingLedger(): Promise<void> {
    if (!this.broker || !this.wallet || !this.provider) {
      throw new Error("Broker not initialized");
    }

    // Check wallet balance first
    const walletBalance = await this.provider.getBalance(this.wallet.address);
    const availableOG = parseFloat(ethers.formatEther(walletBalance));

    console.log(`💰 Wallet balance: ${availableOG.toFixed(4)} OG`);

    // Calculate how much we can safely use (leave 0.02 for gas)
    const gasReserve = 0.02;
    const maxDepositAmount = Math.max(0, availableOG - gasReserve);

    // Minimum recommended by 0G is 1.5 OG
    const minRecommended = 1.5;

    if (maxDepositAmount < 0.1) {
      throw new Error(
        'Insufficient wallet balance. You have ${availableOG.toFixed(4)} OG but need at least 0.12 OG (0.1 for deposit + 0.02 for gas). ' +
        'Get more testnet tokens from https://faucet.0g.ai'
      );
    }

    if (maxDepositAmount < minRecommended) {
      console.log('⚠️  Warning: Wallet has ${availableOG.toFixed(4)} OG. Recommended: ${minRecommended} OG or more for optimal usage.');
    }

    // Use most of what we have, but cap at 10 OG to keep some in wallet
    const depositAmount = Math.min(maxDepositAmount, 10);
    console.log('💸 Depositing ${depositAmount.toFixed(4)} OG to existing ledger (leaving ${gasReserve.toFixed(2)} OG for gas)...');

    try {
      // depositFund() adds to existing ledger balance
      await this.broker.ledger.depositFund(depositAmount);
      console.log("✅ Funds deposited successfully!");

      // Wait for blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the ledger balance
      try {
        const account = await this.broker.ledger.getLedger();
        const { balance: accountBalance } = this.parseAccountBalance(account);
        if (accountBalance) {
          const finalBalance = ethers.formatEther(accountBalance);
          console.log(`✅ Ledger balance confirmed: ${finalBalance} OG`);
          
          if (accountBalance < ethers.parseEther("1.0")) {
            console.log("⚠️  Note: Balance is below 1 OG. You may need to add more for multiple queries.");
          }
        } else {
          console.log("⚠️  Deposit successful but balance verification pending...");
        }
      } catch (verifyError) {
        console.log("⚠️  Deposit successful but verification pending (this is normal)");
      }
    } catch (depositError: any) {
      if (depositError.code === 'INSUFFICIENT_FUNDS') {
        throw new Error(
          'Insufficient funds in wallet (${availableOG.toFixed(4)} OG). Get testnet tokens from: https://faucet.0g.ai'
        );
      }
      throw new Error('Failed to deposit funds to ledger: ${depositError.message}');
    }
  }

  /**
   * Auto-refill ledger from wallet if balance is below threshold
   * @param currentBalance Current ledger balance in OG
   * @param threshold Minimum threshold to trigger refill (default: 0.2 OG)
   * @returns true if refill was performed, false if not needed
   */
  private async autoRefillLedger(currentBalance: number, threshold: number = 0.2): Promise<boolean> {
    if (!this.broker || !this.wallet || !this.provider) {
      throw new Error("Broker not initialized");
    }

    // Check if refill is needed
    if (currentBalance >= threshold) {
      return false; // No refill needed
    }

    console.log('🔄 Auto-refill triggered: Ledger balance (${currentBalance.toFixed(4)} OG) is below threshold (${threshold} OG)');

    // Check wallet balance
    const walletBalance = await this.provider.getBalance(this.wallet.address);
    const availableOG = parseFloat(ethers.formatEther(walletBalance));

    console.log(`💰 Wallet balance: ${availableOG.toFixed(4)} OG`);

    // Calculate how much we can deposit (leave 0.02 for gas)
    const gasReserve = 0.02;
    const maxDepositAmount = Math.max(0, availableOG - gasReserve);

    if (maxDepositAmount < 0.1) {
      throw new Error(
        'Auto-refill failed: Insufficient wallet balance. You have ${availableOG.toFixed(4)} OG but need at least 0.12 OG (0.1 for deposit + 0.02 for gas). ' +
        'Get more testnet tokens from https://faucet.0g.ai'
      );
    }

    // Target: Bring ledger back to 2 OG, or use what we have available (capped at 5 OG)
    const targetRefill = Math.min(2.0, maxDepositAmount, 5.0);
    
    console.log('💸 Auto-depositing ${targetRefill.toFixed(4)} OG to ledger...');

    try {
      await this.broker.ledger.depositFund(targetRefill);
      console.log('✅ Auto-refill successful! Deposited ${targetRefill.toFixed(4)} OG');

      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify new balance
      try {
        const account = await this.broker.ledger.getLedger();
        const { balance } = this.parseAccountBalance(account);
        const newBalance = parseFloat(ethers.formatEther(balance));
        console.log('✅ New ledger balance: ${newBalance.toFixed(4)} OG');
      } catch (verifyError) {
        console.log("⚠️  Auto-refill completed but balance verification pending");
      }

      return true;
    } catch (depositError: any) {
      if (depositError.code === 'INSUFFICIENT_FUNDS') {
        throw new Error(
          'Auto-refill failed: Insufficient wallet funds (${availableOG.toFixed(4)} OG). Get testnet tokens from: https://faucet.0g.ai'
        );
      }
      throw new Error('Auto-refill failed: ${depositError.message}');
    }
  }

  /**
   * Ensures provider is set up (acknowledged + funded)
   * Automatically called before sending queries
   */
  private async ensureProviderSetup(providerAddress: string): Promise<void> {
    // Skip if already set up in this session
    if (this.acknowledgedProviders.has(providerAddress)) {
      return;
    }

    if (!this.broker) {
      throw new Error("Broker not initialized");
    }

    try {
      console.log('🔧 Setting up provider ${providerAddress}...');

      // Step 1: Acknowledge provider (one-time per provider)
      try {
        await this.broker.inference.acknowledgeProviderSigner(providerAddress);
        console.log('✅ Provider acknowledged: ${providerAddress}');
      } catch (ackError: any) {
        if (ackError.message?.includes('AlreadyAcknowledged') ||
            ackError.message?.includes('already acknowledged')) {
          console.log('✓ Provider already acknowledged: ${providerAddress}');
        } else {
          throw ackError;
        }
      }

      // Step 2: Check ledger balance and transfer funds to provider (minimum 0.1 OG required)
      try {
        const account = await this.broker.ledger.getLedger();
        let { balance, totalBalance } = this.parseAccountBalance(account);
        
        let ledgerBalanceNum = parseFloat(ethers.formatEther(balance));
        const totalBalanceNum = parseFloat(ethers.formatEther(totalBalance));

        console.log(`💰 Ledger balance: ${ledgerBalanceNum.toFixed(4)} OG (Total: ${totalBalanceNum.toFixed(4)} OG)`);

        const minTransfer = 0.1; // Minimum per official docs
        const idealTransfer = 1.5; // Recommended

        // If ledger has 0 available balance but total > 0, funds may be locked/allocated
        if (ledgerBalanceNum === 0 && totalBalanceNum === 0) {
          console.log("⚠️  Ledger has 0 balance, attempting to fund it now...");
          try {
            await this.fundExistingLedger();
            
            // Re-check balance after funding
            const newAccount = await this.broker.ledger.getLedger();
            const { balance: newBalance } = this.parseAccountBalance(newAccount);
            const newBalanceNum = parseFloat(ethers.formatEther(newBalance));
            
            console.log('💰 Ledger balance after funding: ${newBalanceNum.toFixed(4)} OG');
            
            if (newBalanceNum < minTransfer) {
              throw new Error(
                'Failed to fund ledger sufficiently. Current balance: ${newBalanceNum.toFixed(4)} OG. ' +
                'Need at least ${minTransfer} OG. Get more tokens from https://faucet.0g.ai'
              );
            }
            
            // Update balance for transfer calculation
            ledgerBalanceNum = newBalanceNum;
          } catch (fundError: any) {
            throw new Error(
              'Cannot fund ledger: ${fundError.message}. Get tokens from https://faucet.0g.ai'
            );
          }
        } else if (ledgerBalanceNum === 0 && totalBalanceNum > 0) {
          // Special case: funds exist but are showing as unavailable
          console.log('⚠️  Strange state: ${totalBalanceNum.toFixed(4)} OG total but 0 OG available.');
          console.log('    This may indicate funds are locked. Using totalBalance for transfer...');
          ledgerBalanceNum = totalBalanceNum;
        }

        // Auto-refill check: If balance is below 0.2 OG, automatically top up from wallet
        if (ledgerBalanceNum < 0.2) {
          console.log('📊 Ledger balance (${ledgerBalanceNum.toFixed(4)} OG) is low, attempting auto-refill...');
          try {
            const refilled = await this.autoRefillLedger(ledgerBalanceNum, 0.2);
            if (refilled) {
              // Re-check balance after refill
              const updatedAccount = await this.broker.ledger.getLedger();
              const { balance: updatedBalance } = this.parseAccountBalance(updatedAccount);
              ledgerBalanceNum = parseFloat(ethers.formatEther(updatedBalance));
              console.log('✅ Ledger refilled! New balance: ${ledgerBalanceNum.toFixed(4)} OG');
            }
          } catch (refillError: any) {
            // If auto-refill fails, throw helpful error
            console.error(`❌ Auto-refill failed: ${refillError.message}`);
            throw new Error(
              `Ledger balance too low (${ledgerBalanceNum.toFixed(4)} OG) and auto-refill failed. ` +
              `${refillError.message}`
            );
          }
        }

        if (ledgerBalanceNum < minTransfer) {
          throw new Error(
            'Insufficient ledger balance (${ledgerBalanceNum.toFixed(4)} OG). Need at least ${minTransfer} OG to transfer to provider. ' +
            'Add more funds using the /api/ai/setup endpoint with action addLedger or get tokens from https://faucet.0g.ai'
          );
        }

        // Use ideal amount if available, otherwise use 90% of what we have
        const actualTransfer = Math.min(
          Math.max(minTransfer, ledgerBalanceNum * 0.9),
          idealTransfer
        );

        const transferAmount = ethers.parseEther(actualTransfer.toFixed(6));
        console.log(`💸 Transferring ${actualTransfer.toFixed(4)} OG to provider...`);

        await this.broker.ledger.transferFund(
          providerAddress,
          'inference',
          transferAmount
        );

        console.log('✅ Transferred ${actualTransfer.toFixed(4)} OG to provider');

        // Wait for transaction to confirm
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (transferError: any) {
        if (transferError.message?.includes('insufficient') ||
            transferError.message?.includes('InsufficientBalance')) {
          throw new Error(
            'Insufficient ledger balance. Add more funds using the /api/ai/setup endpoint with action addLedger first.'
          );
        }
        throw transferError;
      }

      // Mark as set up
      this.acknowledgedProviders.add(providerAddress);
      console.log('✅ Provider ${providerAddress} is ready for queries!');

    } catch (error: any) {
      console.error('❌ Failed to setup provider:', error);
      throw error;
    }
  }

  /**
   * Ensures broker is initialized before any operation
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && this.initPromise) {
      await this.initPromise;
    }

    if (!this.broker || !this.wallet) {
      throw new Error("Broker service not properly initialized");
    }
  }

  /**
   * Get wallet information
   */
  async getWalletInfo(): Promise<{
    address: string;
    balance: string;
    balanceOG: string;
    network: string;
  }> {
    await this.ensureInitialized();

    if (!this.wallet || !this.provider) {
      throw new Error("Wallet not initialized");
    }

    const walletBalance = await this.provider.getBalance(this.wallet.address);

    return {
      address: this.wallet.address,
      balance: ethers.formatEther(walletBalance),
      balanceOG: ethers.formatEther(walletBalance) + ' OG',
      network: process.env.OG_NETWORK_RPC || 'https://evmrpc-testnet.0g.ai'
    };
  }

  /**
   * Deposit funds to ledger (add more to existing ledger)
   * @param amount Amount to deposit in OG tokens
   */
  async depositFunds(amount: number): Promise<string> {
    await this.ensureInitialized();

    try {
      await this.broker!.ledger.depositFund(amount);
      return '✅ Deposited ${amount} OG to ledger successfully';
    } catch (error: any) {
      throw new Error('Failed to deposit funds: ${error.message}');
    }
  }

  /**
   * Add funds to ledger (creates new ledger or adds to existing)
   * @param amount Amount to add
   */
  async addFundsToLedger(amount: number): Promise<string> {
    await this.ensureInitialized();

    try {
      await this.broker!.ledger.addLedger(amount);
      return '✅ Added ${amount} OG to ledger successfully';
    } catch (error: any) {
      throw new Error('Failed to add funds to ledger: ${error.message}');
    }
  }

  /**
   * Get current ledger balance
   */
  async getBalance(): Promise<{
    balance: string;
    totalBalance: string;
    address: string;
  }> {
    await this.ensureInitialized();

    try {
      const account = await this.broker!.ledger.getLedger();
      const { address, balance, totalBalance } = this.parseAccountBalance(account);
      
      return {
        balance: ethers.formatEther(balance),
        totalBalance: ethers.formatEther(totalBalance),
        address
      };
    } catch (error: any) {
      throw new Error('Failed to get balance: ${error.message}');
    }
  }

  /**
   * Manually acknowledge a provider (usually auto-called)
   * @param providerAddress Provider address to acknowledge
   */
  async acknowledgeProvider(providerAddress: string): Promise<string> {
    await this.ensureInitialized();
    
    try {
      await this.broker!.inference.acknowledgeProviderSigner(providerAddress);
      return '✅ Provider ${providerAddress} acknowledged successfully';
    } catch (error: any) {
      if (error.message?.includes('AlreadyAcknowledged')) {
        return '✓ Provider ${providerAddress} already acknowledged';
      }
      throw new Error('Failed to acknowledge provider: ${error.message}');
    }
  }

  /**
   * Manually transfer funds to a specific provider (usually auto-called)
   * @param providerAddress Provider address to transfer funds to
   * @param amount Amount in OG tokens (minimum 0.1, recommended 1.5)
   */
  async transferFundsToProvider(providerAddress: string, amount: number): Promise<string> {
    await this.ensureInitialized();
    
    try {
      const transferAmount = ethers.parseEther(amount.toString());
      await this.broker!.ledger.transferFund(providerAddress, "inference", transferAmount);
      return '✅ Successfully transferred ${amount} OG to provider ${providerAddress}';
    } catch (error: any) {
      throw new Error('Failed to transfer funds to provider: ${error.message}');
    }
  }

  /**
   * List available AI services with enhanced metadata
   */
  async listServices(): Promise<any[]> {
    await this.ensureInitialized();

    try {
      const services = await this.broker!.inference.listService();

      // Enhance services with additional metadata
      return services.map((service: any) => ({
        ...service,
        inputPriceFormatted: ethers.formatEther(service.inputPrice || 0),
        outputPriceFormatted: ethers.formatEther(service.outputPrice || 0),
        isOfficial: Object.values(OFFICIAL_PROVIDERS).includes(service.provider),
        isVerifiable: service.verifiability === 'TeeML',
        modelName: Object.entries(OFFICIAL_PROVIDERS).find(
          ([_, addr]) => addr === service.provider
        )?.[0] || 'Unknown'
      }));
    } catch (error: any) {
      throw new Error('Failed to list services: ${error.message}');
    }
  }

  /**
   * Send a query to an AI service
   * Automatically handles provider setup (acknowledge + fund transfer)
   * @param providerAddress Provider address
   * @param query Query text
   * @param options Optional settings
   */
  async sendQuery(
    providerAddress: string,
    query: string,
    options?: {
      model?: string;
      systemPrompt?: string;
      responseFormat?: 'json' | 'concise' | 'default';
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{
    content: string | null;
    metadata: {
      model: string;
      isValid?: boolean;
      provider: string;
      chatId: string;
      responseFormat?: string;
    };
  }> {
    await this.ensureInitialized();

    // Auto-setup: Ensure provider is acknowledged and funded
    await this.ensureProviderSetup(providerAddress);

    try {
      // Get the service metadata
      const { endpoint, model } = await this.broker!.inference.getServiceMetadata(providerAddress);

      // Build messages array with optional system prompt
      const messages: Array<{ role: string; content: string }> = [];
      
      // Add system prompt based on response format
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      } else if (options?.responseFormat === 'json') {
        messages.push({
          role: "system",
          content: "You are a helpful assistant that responds in valid JSON format. Always structure your responses as parseable JSON objects."
        });
      } else if (options?.responseFormat === 'concise') {
        messages.push({
          role: "system",
          content: "You are a helpful assistant that provides concise, direct answers. Keep responses brief and to the point, avoiding unnecessary elaboration."
        });
      }
      
      // Add user query
      messages.push({ role: "user", content: query });

      // Get headers for authentication (single use - generate fresh for each request)
      const headers = await this.broker!.inference.getRequestHeaders(
        providerAddress,
        JSON.stringify(messages)
      );

      // Create OpenAI client with the service URL
      const openai = new OpenAI({
        baseURL: endpoint,
        apiKey: "", // Empty string as per docs
      });

      // Prepare headers
      const requestHeaders: Record<string, string> = {};
      Object.entries(headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          requestHeaders[key] = value;
        }
      });

      // Build request params
      const requestParams: any = {
        messages,
        model: options?.model || model,
      };

      // Add optional parameters
      if (options?.temperature !== undefined) {
        requestParams.temperature = options.temperature;
      }
      if (options?.maxTokens) {
        requestParams.max_tokens = options.maxTokens;
      }
      if (options?.responseFormat === 'json') {
        requestParams.response_format = { type: "json_object" };
      }

      // Make the API request
      const completion = await openai.chat.completions.create(
        requestParams,
        {
          headers: requestHeaders,
        }
      );

      // Debug: Log the full completion response
      console.log('🔍 Full completion response:', JSON.stringify(completion, null, 2));

      // Process response - extract only the actual content, not reasoning
      const message = completion.choices[0]?.message;
      const content = message?.content || null;
      const chatId = completion.id;

      console.log('📝 Extracted content:', content);
      console.log('🆔 Chat ID:', chatId);
      
      // Check if we got a valid response
      if (!content) {
        const finishReason = completion.choices[0]?.finish_reason;
        console.warn('⚠️  No content in response.');
        console.warn('Finish reason:', finishReason);
        console.warn('Message object:', JSON.stringify(message, null, 2));
        
        // If the model hit token limit during reasoning, provide a helpful error
        if (finishReason === 'length' && (message as any)?.reasoning_content) {
          throw new Error(
            'The AI model exceeded token limit while processing your request. ' +
            'The response was not completed. Please try with a shorter question or contact support.'
          );
        }
        
        throw new Error('No response content received from AI model. Please try again.');
      }

      // Process payment - chatId is optional for verifiable services
      try {
        const isValid = await this.broker!.inference.processResponse(
          providerAddress,
          content || "",
          chatId
        );

        return {
          content,
          metadata: {
            model,
            isValid: isValid || false,
            provider: providerAddress,
            chatId,
            responseFormat: options?.responseFormat
          }
        };
      } catch (error: any) {
        // Enhanced error message for common issues
        if (error.message.includes('Headers already used')) {
          throw new Error(
            'Request headers are single-use. This error indicates a system issue - please try again.'
          );
        }
        
        console.warn('Payment processing warning:', error.message);
        
        // Return response anyway (payment might have succeeded)
        return {
          content,
          metadata: {
            model,
            provider: providerAddress,
            chatId,
            responseFormat: options?.responseFormat
          }
        };
      }
    } catch (error: any) {
      // Enhanced error handling with specific guidance
      if (error.message.includes('Provider not responding')) {
        throw new Error(
          'Provider ${providerAddress} is not responding. Try using another provider from the service list.'
        );
      }
      if (error.message.includes('Insufficient balance')) {
        throw new Error(
          'Insufficient balance. Please add funds to your account before making requests.'
        );
      }
      throw new Error('Query failed: ${error.message}');
    }
  }

  /**
   * Request refund for unused funds from a provider
   * @param providerAddress Provider address
   * @param amount Amount to refund in OG
   */
  async requestRefund(providerAddress: string, amount: number): Promise<string> {
    await this.ensureInitialized();

    try {
      const refundAmount = ethers.parseEther(amount.toString());
      await this.broker!.ledger.retrieveFund("inference", Number(refundAmount));
      return '✅ Refund of ${amount} OG requested successfully';
    } catch (error: any) {
      throw new Error('Failed to request refund: ${error.message}');
    }
  }

  /**
   * Get comprehensive diagnostics about the broker state
   */
  async getDiagnostics(): Promise<any> {
    await this.ensureInitialized();

    if (!this.broker || !this.wallet) {
      throw new Error('Broker not initialized');
    }

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

    try {
      // Get ledger account
      const ledger = await this.broker.ledger.getLedger();
      const ledgerData = sanitize(ledger);

      // Get provider accounts
      const providers = [
        { name: "llama-3.3-70b-instruct", address: OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"] },
        { name: "deepseek-r1-70b", address: OFFICIAL_PROVIDERS["deepseek-r1-70b"] },
        { name: "qwen2.5-vl-72b-instruct", address: OFFICIAL_PROVIDERS["qwen2.5-vl-72b-instruct"] }
      ];

      const providerAccounts: any[] = [];
      for (const prov of providers) {
        try {
          const account = await (this.broker.ledger as any).getAccount(prov.address, "inference");
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

      return {
        walletAddress: this.wallet.address,
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
      };
    } catch (error: any) {
      throw new Error('Diagnostic failed: ${error.message}');
    }
  }

  /**
   * Get balances allocated to providers
   */
  async getProviderBalances(): Promise<{
    balances: Array<{
      name: string;
      address: string;
      balance: string;
      balanceOG: string;
      canRefund: boolean;
    }>;
    message: string;
  }> {
    await this.ensureInitialized();

    if (!this.broker) {
      throw new Error('Broker not initialized');
    }

    const providers = [
      { name: "llama-3.3-70b-instruct", address: OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"] },
      { name: "deepseek-r1-70b", address: OFFICIAL_PROVIDERS["deepseek-r1-70b"] },
      { name: "qwen2.5-vl-72b-instruct", address: OFFICIAL_PROVIDERS["qwen2.5-vl-72b-instruct"] }
    ];

    const balances: any[] = [];

    for (const prov of providers) {
      try {
        const account = await (this.broker.ledger as any).getAccount(prov.address, "inference");
        const balance = (account as any).balance || (account as any)[0] || BigInt(0);
        
        if (balance > 0) {
          balances.push({
            name: prov.name,
            address: prov.address,
            balance: ethers.formatEther(balance),
            balanceOG: '${ethers.formatEther(balance)} OG',
            canRefund: true
          });
        }
      } catch (error: any) {
        // Provider has no balance, skip
      }
    }

    return {
      balances,
      message: balances.length > 0 
        ? 'You have funds allocated to providers that can be refunded!' 
        : 'No funds found with providers'
    };
  }
}

// Singleton instance
export const brokerService = new BrokerService();

