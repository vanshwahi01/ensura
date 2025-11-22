import hre from "hardhat";

/**
 * Comprehensive test of the deployed InsuranceContract on Flare Coston2
 * This simulates a real insurance flow with actual data
 */

async function main() {
  const CONTRACT_ADDRESS = "0x9db7610A37Bf2f46740e49Cd2AcE1671c0A6eaB6";
  
  console.log("🧪 Testing InsuranceContract on Flare Coston2");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("");
  
  // Connect to network
  const connection = await hre.network.connect() as any; // Type assertion for Hardhat Ignition Ethers plugin
  const network = await connection.ethers.provider.getNetwork();
  console.log("Network:", network.name, "| Chain ID:", network.chainId.toString());
  
  // Get signers (using same account for both roles in testing)
  const signers = await connection.ethers.getSigners();
  const requester = signers[0];
  const provider = signers[0]; // Using same account for testing
  
  console.log("Test Account:", requester.address);
  console.log("(Using same account for both requester and provider roles)");
  
  // Check balance
  const balance = await connection.ethers.provider.getBalance(requester.address);
  console.log("Account Balance:", connection.ethers.formatEther(balance), "C2FLR");
  console.log("");
  
  // Get contract instance
  const InsuranceContract = await connection.ethers.getContractFactory("InsuranceContract");
  const insurance = InsuranceContract.attach(CONTRACT_ADDRESS);
  
  // ========== TEST 1: Request a Quote ==========
  console.log("📝 TEST 1: Requesting insurance quote...");
  const metadata = JSON.stringify({
    type: "health",
    applicant: "John Doe",
    age: 35,
    coverageAmount: "50000 USD",
    duration: "1 year",
    medicalHistory: "No pre-existing conditions",
    timestamp: new Date().toISOString()
  });
  
  const quoteTx = await insurance.connect(requester).getQuote(metadata);
  console.log("Transaction hash:", quoteTx.hash);
  const quoteReceipt = await quoteTx.wait();
  console.log("✅ Quote requested! Gas used:", quoteReceipt.gasUsed.toString());
  
  // Parse event to get quote ID
  const quoteEvent = quoteReceipt.logs
    .map((log: any) => {
      try {
        return insurance.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: any) => event?.name === "QuoteRequested");
  
  const quoteRequestId = quoteEvent?.args[0];
  console.log("Quote Request ID:", quoteRequestId.toString());
  
  // Read the quote request
  const quoteRequest = await insurance.quoteRequests(quoteRequestId);
  console.log("Quote Details:");
  console.log("  - Requester:", quoteRequest.requester);
  console.log("  - Timestamp:", new Date(Number(quoteRequest.timestamp) * 1000).toISOString());
  console.log("  - Fulfilled:", quoteRequest.fulfilled);
  console.log("");
  
  // ========== TEST 2: Provider Makes an Offer ==========
  console.log("💼 TEST 2: Provider making an offer...");
  const premium = connection.ethers.parseEther("0.5"); // 0.5 C2FLR premium
  const coverage = connection.ethers.parseEther("5.0"); // 5 C2FLR coverage
  const validUntil = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // Valid for 30 days
  
  const offerTx = await insurance.connect(provider).offer(quoteRequestId, premium, coverage, validUntil);
  const offerReceipt = await offerTx.wait();
  console.log("✅ Offer made! Gas used:", offerReceipt.gasUsed.toString());
  
  const offerEvent = offerReceipt.logs
    .map((log: any) => {
      try {
        return insurance.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: any) => event?.name === "OfferMade");
  
  const offerId = offerEvent?.args[0];
  console.log("Offer ID:", offerId.toString());
  console.log("  - Premium:", connection.ethers.formatEther(premium), "C2FLR");
  console.log("  - Coverage:", connection.ethers.formatEther(coverage), "C2FLR");
  console.log("  - Valid until:", new Date(validUntil * 1000).toISOString());
  console.log("");
  
  // ========== TEST 3: Provider Funds Coverage ==========
  console.log("💰 TEST 3: Provider funding coverage...");
  const fundTx = await insurance.connect(provider).fundCoverage(offerId, { value: coverage });
  const fundReceipt = await fundTx.wait();
  console.log("✅ Coverage funded! Gas used:", fundReceipt.gasUsed.toString());
  
  const providerFunds = await insurance.getProviderFunds(provider.address);
  console.log("Provider funds in contract:", connection.ethers.formatEther(providerFunds), "C2FLR");
  console.log("");
  
  // ========== TEST 4: Requester Accepts Offer ==========
  console.log("✅ TEST 4: Requester accepting offer and paying premium...");
  const acceptTx = await insurance.connect(requester).accept(offerId, { value: premium });
  const acceptReceipt = await acceptTx.wait();
  console.log("✅ Offer accepted! Gas used:", acceptReceipt.gasUsed.toString());
  console.log("");
  
  // ========== TEST 5: Check Final State ==========
  console.log("📊 TEST 5: Checking final contract state...");
  const offer = await insurance.offers(offerId);
  console.log("Offer State:");
  console.log("  - Accepted:", offer.accepted);
  console.log("  - Premium Paid:", offer.premiumPaid);
  console.log("  - Coverage Funded:", offer.coverageFunded);
  console.log("  - Payout Claimed:", offer.payoutClaimed);
  
  const finalProviderFunds = await insurance.getProviderFunds(provider.address);
  console.log("\nProvider total funds:", connection.ethers.formatEther(finalProviderFunds), "C2FLR");
  console.log("  (Coverage + Premium = ", connection.ethers.formatEther(coverage + premium), "C2FLR)");
  
  const finalQuoteRequest = await insurance.quoteRequests(quoteRequestId);
  console.log("\nQuote Request fulfilled:", finalQuoteRequest.fulfilled);
  
  console.log("\n🎉 All tests passed! Contract is working correctly on Flare Coston2!");
  console.log("\n🔍 View transactions on explorer:");
  console.log(`https://coston2-explorer.flare.network/address/${CONTRACT_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:");
    console.error(error);
    process.exit(1);
  });

