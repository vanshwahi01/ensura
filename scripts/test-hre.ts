import hre from "hardhat";

async function main() {
  console.log("Testing HRE...");
  console.log("hre keys:", Object.keys(hre));
  console.log("hre.ethers exists:", !!hre.ethers);
  
  if (hre.ethers) {
    console.log("ethers keys:", Object.keys(hre.ethers));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

