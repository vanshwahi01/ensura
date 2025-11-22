import { ethers } from "ethers";
import { createZGComputeNetworkBroker, ZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";

// Official 0G providers (from starter kit)
export const OFFICIAL_PROVIDERS = {
  "llama-3.3-70b-instruct": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
  "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3",
  "qwen2.5-vl-72b-instruct": "0x6D233D2610c32f630ED53E8a7Cbf759568041f8f"
};

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
      
      // Parse account data (SDK returns array format)
      // Array format: [address, balance, totalBalance, ...]
      let balance: bigint;
      let totalBalance: bigint;
      
      if (Array.isArray(account)) {
        balance = BigInt(account[1] || 0);
        totalBalance = BigInt(account[2] || 0);
      } else {
        balance = (account as any).balance || BigInt(0);
        totalBalance = (account as any).totalBalance || BigInt(0);
      }

      const balanceNum = parseFloat(ethers.formatEther(balance));
      const totalBalanceNum = parseFloat(ethers.formatEther(totalBalance));

      console.log(`💰 Ledger balance: ${balanceNum.toFixed(4)} OG (Total: ${totalBalanceNum.toFixed(4)} OG)`);

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
        console.log(`✅ Ledger has sufficient balance: ${balanceNum.toFixed(4)} OG`);
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
        `Insufficient wallet balance. You have ${availableOG.toFixed(4)} OG but need at least 0.12 OG (0.1 for ledger + 0.02 for gas). ` +
        `Get more testnet tokens from https://faucet.0g.ai`
      );
    }

    if (maxLedgerAmount < minRecommended) {
      console.log(`⚠️  Warning: Wallet has ${availableOG.toFixed(4)} OG. Recommended: ${minRecommended} OG or more for optimal usage.`);
    }

    // Use most of what we have, but cap at 10 OG to keep some in wallet for future operations
    const ledgerAmount = Math.min(maxLedgerAmount, 10);
    console.log(`🔨 Funding ledger with ${ledgerAmount.toFixed(4)} OG (leaving ${gasReserve.toFixed(2)} OG for gas)...`);

    try {
      // addLedger() creates a NEW ledger account (fails if account exists)
      await this.broker.ledger.addLedger(ledgerAmount);
      console.log("✅ New ledger created successfully!");

      // Wait for blockchain confirmation (0G is fast, but give it a moment)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the ledger balance
      try {
        const newAccount = await this.broker.ledger.getLedger();
        if (newAccount.balance) {
          const finalBalance = ethers.formatEther(newAccount.balance);
          console.log(`✅ Ledger balance confirmed: ${finalBalance} OG`);
          
          if (newAccount.balance < ethers.parseEther("1.0")) {
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
          `Insufficient funds in wallet (${availableOG.toFixed(4)} OG). Get testnet tokens from: https://faucet.0g.ai`
        );
      }
      throw new Error(`Failed to create new ledger: ${createError.message}`);
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
        `Insufficient wallet balance. You have ${availableOG.toFixed(4)} OG but need at least 0.12 OG (0.1 for deposit + 0.02 for gas). ` +
        `Get more testnet tokens from https://faucet.0g.ai`
      );
    }

    if (maxDepositAmount < minRecommended) {
      console.log(`⚠️  Warning: Wallet has ${availableOG.toFixed(4)} OG. Recommended: ${minRecommended} OG or more for optimal usage.`);
    }

    // Use most of what we have, but cap at 10 OG to keep some in wallet
    const depositAmount = Math.min(maxDepositAmount, 10);
    console.log(`💸 Depositing ${depositAmount.toFixed(4)} OG to existing ledger (leaving ${gasReserve.toFixed(2)} OG for gas)...`);

    try {
      // depositFund() adds to existing ledger balance
      await this.broker.ledger.depositFund(depositAmount);
      console.log("✅ Funds deposited successfully!");

      // Wait for blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the ledger balance
      try {
        const account = await this.broker.ledger.getLedger();
        if (account.balance) {
          const finalBalance = ethers.formatEther(account.balance);
          console.log(`✅ Ledger balance confirmed: ${finalBalance} OG`);
          
          if (account.balance < ethers.parseEther("1.0")) {
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
          `Insufficient funds in wallet (${availableOG.toFixed(4)} OG). Get testnet tokens from: https://faucet.0g.ai`
        );
      }
      throw new Error(`Failed to deposit funds to ledger: ${depositError.message}`);
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
      console.log(`🔧 Setting up provider ${providerAddress}...`);

      // Step 1: Acknowledge provider (one-time per provider)
      try {
        await this.broker.inference.acknowledgeProviderSigner(providerAddress);
        console.log(`✅ Provider acknowledged: ${providerAddress}`);
      } catch (ackError: any) {
        if (ackError.message?.includes('AlreadyAcknowledged') ||
            ackError.message?.includes('already acknowledged')) {
          console.log(`✓ Provider already acknowledged: ${providerAddress}`);
        } else {
          throw ackError;
        }
      }

      // Step 2: Check ledger balance and transfer funds to provider (minimum 0.1 OG required)
      try {
        const account = await this.broker.ledger.getLedger();
        
        // Parse account data (SDK returns array format)
        let balance: bigint;
        let totalBalance: bigint;
        
        if (Array.isArray(account)) {
          balance = BigInt(account[1] || 0);
          totalBalance = BigInt(account[2] || 0);
        } else {
          balance = (account as any).balance || BigInt(0);
          totalBalance = (account as any).totalBalance || BigInt(0);
        }
        
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
            let newBalance: bigint;
            
            if (Array.isArray(newAccount)) {
              newBalance = BigInt(newAccount[1] || 0);
            } else {
              newBalance = (newAccount as any).balance || BigInt(0);
            }
            
            const newBalanceNum = parseFloat(ethers.formatEther(newBalance));
            
            console.log(`💰 Ledger balance after funding: ${newBalanceNum.toFixed(4)} OG`);
            
            if (newBalanceNum < minTransfer) {
              throw new Error(
                `Failed to fund ledger sufficiently. Current balance: ${newBalanceNum.toFixed(4)} OG. ` +
                `Need at least ${minTransfer} OG. Get more tokens from https://faucet.0g.ai`
              );
            }
            
            // Update balance for transfer calculation
            ledgerBalanceNum = newBalanceNum;
          } catch (fundError: any) {
            throw new Error(
              `Cannot fund ledger: ${fundError.message}. Get tokens from https://faucet.0g.ai`
            );
          }
        } else if (ledgerBalanceNum === 0 && totalBalanceNum > 0) {
          // Special case: funds exist but are showing as unavailable
          console.log(`⚠️  Strange state: ${totalBalanceNum.toFixed(4)} OG total but 0 OG available.`);
          console.log(`    This may indicate funds are locked. Using totalBalance for transfer...`);
          ledgerBalanceNum = totalBalanceNum;
        }

        if (ledgerBalanceNum < minTransfer) {
          throw new Error(
            `Insufficient ledger balance (${ledgerBalanceNum.toFixed(4)} OG). Need at least ${minTransfer} OG to transfer to provider. ` +
            `Add more funds using the /api/ai/setup endpoint with action 'addLedger' or get tokens from https://faucet.0g.ai`
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

        console.log(`✅ Transferred ${actualTransfer.toFixed(4)} OG to provider`);

        // Wait for transaction to confirm
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (transferError: any) {
        if (transferError.message?.includes('insufficient') ||
            transferError.message?.includes('InsufficientBalance')) {
          throw new Error(
            `Insufficient ledger balance. Add more funds using the /api/ai/setup endpoint with action 'addLedger' first.`
          );
        }
        throw transferError;
      }

      // Mark as set up
      this.acknowledgedProviders.add(providerAddress);
      console.log(`✅ Provider ${providerAddress} is ready for queries!`);

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
      return `✅ Deposited ${amount} OG to ledger successfully`;
    } catch (error: any) {
      throw new Error(`Failed to deposit funds: ${error.message}`);
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
      return `✅ Added ${amount} OG to ledger successfully`;
    } catch (error: any) {
      throw new Error(`Failed to add funds to ledger: ${error.message}`);
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
      
      // Handle both array and object formats from SDK
      // Array format: [address, balance, totalBalance, ...]
      // Object format: { address, balance, totalBalance, ... }
      let address: string;
      let balance: bigint;
      let totalBalance: bigint;
      
      if (Array.isArray(account)) {
        address = account[0] || 'N/A';
        balance = BigInt(account[1] || 0);
        totalBalance = BigInt(account[2] || 0);
      } else {
        address = (account as any).address || 'N/A';
        balance = (account as any).balance || BigInt(0);
        totalBalance = (account as any).totalBalance || BigInt(0);
      }
      
      return {
        balance: ethers.formatEther(balance),
        totalBalance: ethers.formatEther(totalBalance),
        address
      };
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
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
      return `✅ Provider ${providerAddress} acknowledged successfully`;
    } catch (error: any) {
      if (error.message?.includes('AlreadyAcknowledged')) {
        return `✓ Provider ${providerAddress} already acknowledged`;
      }
      throw new Error(`Failed to acknowledge provider: ${error.message}`);
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
      return `✅ Successfully transferred ${amount} OG to provider ${providerAddress}`;
    } catch (error: any) {
      throw new Error(`Failed to transfer funds to provider: ${error.message}`);
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
      throw new Error(`Failed to list services: ${error.message}`);
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
      fallbackFee?: number;
    }
  ): Promise<{
    content: string | null;
    metadata: {
      model: string;
      isValid?: boolean;
      provider: string;
      chatId: string;
      usedFallbackFee?: boolean;
      fallbackFeeAmount?: number;
    };
  }> {
    await this.ensureInitialized();

    // Auto-setup: Ensure provider is acknowledged and funded
    await this.ensureProviderSetup(providerAddress);

    try {
      // Get the service metadata
      const { endpoint, model } = await this.broker!.inference.getServiceMetadata(providerAddress);

      // Get headers for authentication (single use - generate fresh for each request)
      const headers = await this.broker!.inference.getRequestHeaders(providerAddress, query);

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

      // Make the API request
      const completion = await openai.chat.completions.create(
        {
          messages: [{ role: "user", content: query }],
          model: options?.model || model,
        },
        {
          headers: requestHeaders,
        }
      );

      // Process response
      const content = completion.choices[0].message.content;
      const chatId = completion.id;

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
            isValid,
            provider: providerAddress,
            chatId,
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
          }
        };
      }
    } catch (error: any) {
      // Enhanced error handling with specific guidance
      if (error.message.includes('Provider not responding')) {
        throw new Error(
          `Provider ${providerAddress} is not responding. Try using another provider from the service list.`
        );
      }
      if (error.message.includes('Insufficient balance')) {
        throw new Error(
          'Insufficient balance. Please add funds to your account before making requests.'
        );
      }
      throw new Error(`Query failed: ${error.message}`);
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
      return `✅ Refund of ${amount} OG requested successfully`;
    } catch (error: any) {
      throw new Error(`Failed to request refund: ${error.message}`);
    }
  }
}

// Singleton instance
export const brokerService = new BrokerService();

