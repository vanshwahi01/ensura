import { expect } from "chai";
import hre from "hardhat";

describe("InsuranceContract", function () {
  let insuranceContract;
  let requester, provider;

  beforeEach(async function () {
    // Get test accounts
    [requester, provider] = await hre.ethers.getSigners();

    // Deploy contract
    const InsuranceContract = await hre.ethers.getContractFactory("InsuranceContract");
    insuranceContract = await InsuranceContract.deploy();
  });

  it("Should complete a full insurance flow", async function () {
    // 1. Requester requests a quote
    const tx = await insuranceContract.connect(requester).getQuote("Health insurance for John Doe");
    const receipt = await tx.wait();
    
    console.log("✅ Quote requested");

    // 2. Provider makes an offer
    const premium = hre.ethers.parseEther("0.1"); // 0.1 ETH premium
    const coverage = hre.ethers.parseEther("1.0"); // 1 ETH coverage
    const validUntil = Math.floor(Date.now() / 1000) + 86400; // Valid for 1 day

    await insuranceContract.connect(provider).offer(0, premium, coverage, validUntil);
    console.log("✅ Offer made");

    // 3. Provider funds the coverage
    await insuranceContract.connect(provider).fundCoverage(0, { value: coverage });
    console.log("✅ Coverage funded");

    // 4. Requester accepts offer and pays premium
    await insuranceContract.connect(requester).accept(0, { value: premium });
    console.log("✅ Offer accepted and premium paid");

    // 5. Check provider funds
    const providerFunds = await insuranceContract.getProviderFunds(provider.address);
    expect(providerFunds).to.equal(coverage + premium);
    console.log("✅ Provider has correct funds:", hre.ethers.formatEther(providerFunds), "ETH");

    // 6. Verify offer was accepted
    const offer = await insuranceContract.offers(0);
    expect(offer.accepted).to.be.true;
    expect(offer.premiumPaid).to.be.true;
    expect(offer.coverageFunded).to.be.true;
    console.log("✅ All checks passed!");
  });

  it("Should allow claim payout", async function () {
    // Setup: Create and accept an offer
    const premium = hre.ethers.parseEther("0.1");
    const coverage = hre.ethers.parseEther("1.0");
    const validUntil = Math.floor(Date.now() / 1000) + 86400;

    await insuranceContract.connect(requester).getQuote("Travel insurance");
    await insuranceContract.connect(provider).offer(0, premium, coverage, validUntil);
    await insuranceContract.connect(provider).fundCoverage(0, { value: coverage });
    await insuranceContract.connect(requester).accept(0, { value: premium });

    // Get requester balance before claim
    const balanceBefore = await hre.ethers.provider.getBalance(requester.address);

    // Claim payout
    const tx = await insuranceContract.connect(requester).claimPayout(0);
    const receipt = await tx.wait();
    
    // Calculate gas cost
    const gasCost = receipt.gasUsed * receipt.gasPrice;

    // Get requester balance after claim
    const balanceAfter = await hre.ethers.provider.getBalance(requester.address);

    // Requester should have received the coverage amount (minus gas)
    const expectedBalance = balanceBefore + coverage - gasCost;
    expect(balanceAfter).to.be.closeTo(expectedBalance, hre.ethers.parseEther("0.001")); // Allow small difference

    console.log("✅ Payout claimed successfully");
    console.log("   Payout amount:", hre.ethers.formatEther(coverage), "ETH");
  });

  it("Should allow provider refund if offer not accepted", async function () {
    const premium = hre.ethers.parseEther("0.1");
    const coverage = hre.ethers.parseEther("1.0");
    const validUntil = Math.floor(Date.now() / 1000) + 1; // Expires in 1 second

    await insuranceContract.connect(requester).getQuote("Car insurance");
    await insuranceContract.connect(provider).offer(0, premium, coverage, validUntil);
    await insuranceContract.connect(provider).fundCoverage(0, { value: coverage });

    // Wait for offer to expire
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Provider should be able to get refund
    const balanceBefore = await hre.ethers.provider.getBalance(provider.address);
    const tx = await insuranceContract.connect(provider).refundProvider(0);
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balanceAfter = await hre.ethers.provider.getBalance(provider.address);

    const expectedBalance = balanceBefore + coverage - gasCost;
    expect(balanceAfter).to.be.closeTo(expectedBalance, hre.ethers.parseEther("0.001"));

    console.log("✅ Provider refund successful");
  });
});

