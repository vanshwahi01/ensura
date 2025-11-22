import hre from "hardhat";
const { ethers } = hre;

/**
 * Example script to interact with the deployed InsuranceContract
 * Usage: npx hardhat run scripts/interact.ts --network coston2
 */

async function main() {
  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x9db7610A37Bf2f46740e49Cd2AcE1671c0A6eaB6";
  
  console.log("🔗 Connecting to InsuranceContract...");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Contract Address:", CONTRACT_ADDRESS);
  
  // Get the contract instance
  const InsuranceContract = await ethers.getContractFactory("InsuranceContract");
  const insurance = InsuranceContract.attach(CONTRACT_ADDRESS);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  // Read contract data
  console.log("\n📊 Reading contract data...");
  const quoteRequestsCount = await insurance.getQuoteRequestsCount();
  const offersCount = await insurance.getOffersCount();
  
  console.log("Quote Requests Count:", quoteRequestsCount.toString());
  console.log("Offers Count:", offersCount.toString());
  
  // Example: Create a quote request
  console.log("\n📝 Creating a new quote request...");
  const metadata = JSON.stringify({
    type: "health",
    age: 30,
    coverage: "100000",
    timestamp: new Date().toISOString()
  });
  
  const tx = await insurance.getQuote(metadata);
  console.log("Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Quote request created! Gas used:", receipt?.gasUsed.toString());
  
  // Get the quote request ID from the event
  const quoteRequestedEvent = receipt?.logs
    .map((log: any) => {
      try {
        return insurance.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: any) => event?.name === "QuoteRequested");
  
  if (quoteRequestedEvent) {
    const quoteRequestId = quoteRequestedEvent.args[0];
    console.log("New Quote Request ID:", quoteRequestId.toString());
    
    // Read the quote request
    console.log("\n📋 Reading quote request details...");
    const quoteRequest = await insurance.quoteRequests(quoteRequestId);
    console.log("Quote Request Details:");
    console.log("- Requester:", quoteRequest.requester);
    console.log("- Timestamp:", new Date(Number(quoteRequest.timestamp) * 1000).toISOString());
    console.log("- Metadata:", quoteRequest.metadata);
    console.log("- Fulfilled:", quoteRequest.fulfilled);
  }
  
  console.log("\n✨ Interaction completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:");
    console.error(error);
    process.exit(1);
  });

