import { network } from "hardhat";

/**
 * Seed 2 demo offers to the InsuranceDemoContract
 * These will be real, funded offers that users can accept
 */

// UPDATE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS
const DEMO_CONTRACT_ADDRESS = "0x4AA9E042EA557A08f1454B6939081C7039f6ea3a";

async function main() {
  console.log("🌱 Seeding demo offers to InsuranceDemoContract...\n");

  if (!DEMO_CONTRACT_ADDRESS) {
    console.error("❌ ERROR: DEMO_CONTRACT_ADDRESS is not set!");
    process.exit(1);
  }

  // Connect to network (Hardhat 3 + ES modules)
  const { ethers } = await network.connect();

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Seeding with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "C2FLR");

  if (balance < ethers.parseEther("1")) {
    console.log("\n⚠️  WARNING: You need at least 1 C2FLR to seed offers");
    console.log("   Get testnet tokens from: https://faucet.flare.network/coston2\n");
    return;
  }

  // Connect to deployed contract
  const contract = await ethers.getContractAt("InsuranceDemoContract", DEMO_CONTRACT_ADDRESS);
  console.log("✅ Connected to contract at:", DEMO_CONTRACT_ADDRESS);

  // Check current offer count
  const currentOffers = await contract.getOfferCount();
  console.log("📊 Current offers on contract:", currentOffers.toString(), "\n");

  console.log("═══════════════════════════════════════════════════════\n");

  // OFFER 1: Agency Insurance (Ensura Agency)
  console.log("🏢 Creating Offer 1: Agency Insurance");
  console.log("   Provider: Ensura Agency");
  console.log("   Type: Health Insurance");
  
  const offer1Premium = ethers.parseEther("0.15");      // 0.15 C2FLR = ~$150 at $0.025/token
  const offer1Coverage = ethers.parseEther("100");      // 100 C2FLR = ~$100,000 coverage
  const offer1Duration = 365 * 24 * 60 * 60;           // Valid for 1 year

  console.log("   Premium: 0.15 C2FLR (~$150)");
  console.log("   Coverage: 100 C2FLR (~$100,000)");
  console.log("   Valid for: 1 year");

  try {
    const tx1 = await contract.createOffer(
      "Ensura Agency",
      "Health Insurance",
      offer1Premium,
      offer1Coverage,
      offer1Duration,
      { value: offer1Coverage } // Fund the offer
    );
    
    console.log("   ⏳ Transaction submitted:", tx1.hash);
    const receipt1 = await tx1.wait();
    console.log("   ✅ Offer 1 created successfully!");
    console.log("   🔗 View tx:", `https://coston2-explorer.flare.network/tx/${tx1.hash}`);
  } catch (error: any) {
    console.error("   ❌ Failed to create offer 1:", error.message);
  }

  console.log("\n═══════════════════════════════════════════════════════\n");

  // OFFER 2: P2P Insurance (Alice - Community Underwriter)
  console.log("👤 Creating Offer 2: P2P Insurance");
  console.log("   Provider: Alice");
  console.log("   Type: Auto Insurance");
  
  const offer2Premium = ethers.parseEther("0.18");      // 0.18 C2FLR = ~$180
  const offer2Coverage = ethers.parseEther("80");       // 80 C2FLR = ~$80,000 coverage
  const offer2Duration = 365 * 24 * 60 * 60;           // Valid for 1 year

  console.log("   Premium: 0.18 C2FLR (~$180)");
  console.log("   Coverage: 80 C2FLR (~$80,000)");
  console.log("   Valid for: 1 year");

  try {
    const tx2 = await contract.createOffer(
      "Alice",
      "Auto Insurance",
      offer2Premium,
      offer2Coverage,
      offer2Duration,
      { value: offer2Coverage } // Fund the offer
    );
    
    console.log("   ⏳ Transaction submitted:", tx2.hash);
    const receipt2 = await tx2.wait();
    console.log("   ✅ Offer 2 created successfully!");
    console.log("   🔗 View tx:", `https://coston2-explorer.flare.network/tx/${tx2.hash}`);
  } catch (error: any) {
    console.error("   ❌ Failed to create offer 2:", error.message);
  }

  console.log("\n═══════════════════════════════════════════════════════\n");

  // Summary
  const finalOffers = await contract.getOfferCount();
  console.log("🎉 Seeding complete!");
  console.log("📊 Total offers on contract:", finalOffers.toString());
  
  console.log("\n📋 Offer Summary:");
  console.log("   Offer ID 0: Ensura Agency - Health Insurance");
  console.log("   Offer ID 1: Alice - Auto Insurance");

  console.log("\n🔧 Next steps:");
  console.log("   1. Update src/lib/contractService.ts with:");
  console.log(`      - DEMO_CONTRACT_ADDRESS = "${DEMO_CONTRACT_ADDRESS}"`);
  console.log("      - DEMO_OFFER_IDS = { agency: 0, p2p: 1 }");
  console.log("   2. Test accepting offers in your frontend!");
  console.log("   3. Monitor on Coston2 Explorer:");
  console.log(`      https://coston2-explorer.flare.network/address/${DEMO_CONTRACT_ADDRESS}\n`);

  // Display offer details
  console.log("\n📝 Offer Details for Frontend Integration:\n");
  
  for (let i = 0; i < 2; i++) {
    try {
      const offer = await contract.getOffer(i);
      console.log(`   Offer ${i}:`);
      console.log(`     Provider: ${offer.providerName}`);
      console.log(`     Type: ${offer.insuranceType}`);
      console.log(`     Premium: ${ethers.formatEther(offer.premium)} C2FLR`);
      console.log(`     Coverage: ${ethers.formatEther(offer.coverage)} C2FLR`);
      console.log(`     Funded: ${offer.funded}`);
      console.log(`     Accepted: ${offer.accepted}\n`);
    } catch (error) {
      console.log(`   Offer ${i}: Not yet created\n`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });

