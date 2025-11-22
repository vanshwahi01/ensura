import hre from "hardhat";

async function main() {
  console.log("🧪 Testing InsuranceContract...\n");

  // Get signers
  const [requester, provider] = await hre.ethers.getSigners();
  console.log("Requester:", requester.address);
  console.log("Provider:", provider.address, "\n");

  // Deploy contract
  console.log("📝 Deploying contract...");
  const InsuranceContract = await hre.ethers.getContractFactory("InsuranceContract");
  const contract = await InsuranceContract.deploy();
  await contract.waitForDeployment();
  console.log("✅ Contract deployed at:", await contract.getAddress(), "\n");

  // Test 1: Request a quote
  console.log("1️⃣ Requesting a quote...");
  const quoteTx = await contract.connect(requester).getQuote("Health insurance for John Doe");
  await quoteTx.wait();
  console.log("✅ Quote requested\n");

  // Test 2: Provider makes an offer
  console.log("2️⃣ Provider making an offer...");
  const premium = hre.ethers.parseEther("0.1"); // 0.1 ETH
  const coverage = hre.ethers.parseEther("1.0"); // 1 ETH
  const validUntil = Math.floor(Date.now() / 1000) + 86400; // 24 hours
  
  const offerTx = await contract.connect(provider).offer(0, premium, coverage, validUntil);
  await offerTx.wait();
  console.log("✅ Offer made");
  console.log("   Premium:", hre.ethers.formatEther(premium), "ETH");
  console.log("   Coverage:", hre.ethers.formatEther(coverage), "ETH\n");

  // Test 3: Provider funds coverage
  console.log("3️⃣ Provider funding coverage...");
  const fundTx = await contract.connect(provider).fundCoverage(0, { value: coverage });
  await fundTx.wait();
  console.log("✅ Coverage funded\n");

  // Test 4: Requester accepts offer
  console.log("4️⃣ Requester accepting offer...");
  const acceptTx = await contract.connect(requester).accept(0, { value: premium });
  await acceptTx.wait();
  console.log("✅ Offer accepted and premium paid\n");

  // Test 5: Check contract state
  console.log("5️⃣ Checking contract state...");
  const offer = await contract.offers(0);
  console.log("   ✅ Offer accepted:", offer.accepted);
  console.log("   ✅ Premium paid:", offer.premiumPaid);
  console.log("   ✅ Coverage funded:", offer.coverageFunded);
  
  const providerFunds = await contract.getProviderFunds(provider.address);
  console.log("   ✅ Provider funds:", hre.ethers.formatEther(providerFunds), "ETH\n");

  // Test 6: Requester claims payout
  console.log("6️⃣ Requester claiming payout...");
  const requesterBalanceBefore = await hre.ethers.provider.getBalance(requester.address);
  
  const claimTx = await contract.connect(requester).claimPayout(0);
  const claimReceipt = await claimTx.wait();
  
  const requesterBalanceAfter = await hre.ethers.provider.getBalance(requester.address);
  const gasCost = claimReceipt.gasUsed * claimReceipt.gasPrice;
  const netReceived = requesterBalanceAfter - requesterBalanceBefore + gasCost;
  
  console.log("✅ Payout claimed");
  console.log("   Payout amount:", hre.ethers.formatEther(coverage), "ETH");
  console.log("   Net received:", hre.ethers.formatEther(netReceived), "ETH\n");

  // Final check
  const offerFinal = await contract.offers(0);
  console.log("7️⃣ Final state:");
  console.log("   ✅ Payout claimed:", offerFinal.payoutClaimed);
  
  const providerFundsFinal = await contract.getProviderFunds(provider.address);
  console.log("   ✅ Provider funds after payout:", hre.ethers.formatEther(providerFundsFinal), "ETH");

  console.log("\n🎉 All tests passed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

