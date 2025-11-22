import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🧪 Testing InsuranceContract locally...\n");

  // Get test accounts
  const [requester, provider] = await ethers.getSigners();
  console.log("Requester:", requester.address);
  console.log("Provider:", provider.address);
  console.log("");

  // Deploy contract
  console.log("📝 Deploying contract...");
  const InsuranceContract = await ethers.getContractFactory("InsuranceContract");
  const contract = await InsuranceContract.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed at:", contractAddress);
  console.log("");

  // Test 1: Request a quote
  console.log("1️⃣ Requesting a quote...");
  const quoteTx = await contract.connect(requester).getQuote("Health insurance for testing");
  await quoteTx.wait();
  console.log("✅ Quote requested");
  console.log("");

  // Test 2: Provider makes an offer
  console.log("2️⃣ Provider making an offer...");
  const premium = ethers.parseEther("0.1"); // 0.1 ETH premium
  const coverage = ethers.parseEther("1.0"); // 1 ETH coverage
  const validUntil = Math.floor(Date.now() / 1000) + 86400; // Valid for 24 hours

  const offerTx = await contract.connect(provider).offer(0, premium, coverage, validUntil);
  await offerTx.wait();
  console.log("✅ Offer made");
  console.log("   Premium:", ethers.formatEther(premium), "ETH");
  console.log("   Coverage:", ethers.formatEther(coverage), "ETH");
  console.log("");

  // Test 3: Provider funds coverage
  console.log("3️⃣ Provider funding coverage...");
  const fundTx = await contract.connect(provider).fundCoverage(0, { value: coverage });
  await fundTx.wait();
  console.log("✅ Coverage funded");
  console.log("");

  // Test 4: Requester accepts offer
  console.log("4️⃣ Requester accepting offer and paying premium...");
  const acceptTx = await contract.connect(requester).accept(0, { value: premium });
  await acceptTx.wait();
  console.log("✅ Offer accepted and premium paid");
  console.log("");

  // Test 5: Check offer state
  console.log("5️⃣ Checking offer state...");
  const offer = await contract.offers(0);
  console.log("   Accepted:", offer.accepted);
  console.log("   Premium Paid:", offer.premiumPaid);
  console.log("   Coverage Funded:", offer.coverageFunded);
  console.log("");

  // Test 6: Check provider funds
  const providerFunds = await contract.getProviderFunds(provider.address);
  console.log("6️⃣ Provider funds:", ethers.formatEther(providerFunds), "ETH");
  console.log("   (Should be premium + coverage = 1.1 ETH)");
  console.log("");

  // Test 7: Claim payout
  console.log("7️⃣ Requester claiming payout...");
  const claimTx = await contract.connect(requester).claimPayout(0);
  await claimTx.wait();
  console.log("✅ Payout claimed");
  console.log("");

  // Test 8: Final state
  console.log("8️⃣ Final state:");
  const offerFinal = await contract.offers(0);
  console.log("   Payout Claimed:", offerFinal.payoutClaimed);
  
  const providerFundsFinal = await contract.getProviderFunds(provider.address);
  console.log("   Provider funds after payout:", ethers.formatEther(providerFundsFinal), "ETH");
  console.log("   (Should be 0.1 ETH - just the premium)");
  console.log("");

  console.log("🎉 All tests passed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

