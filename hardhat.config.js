import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatIgnitionEthers from "@nomicfoundation/hardhat-ignition-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import "dotenv/config";

/** @type import('hardhat/config').HardhatUserConfig */
export default defineConfig({
  plugins: [
    hardhatEthers,
    hardhatIgnitionEthers,
    hardhatVerify,
  ],
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Flare Mainnet
    flare: {
      type: "http",
      url: process.env.FLARE_RPC_URL || "https://flare-api.flare.network/ext/C/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 14
    },
    // Flare Testnet (Coston2)
    coston2: {
      type: "http",
      url: process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 114
    },
    // Local Hardhat network
    hardhat: {
      type: "edr-simulated",
      chainId: 31337
    }
  },
  // Hardhat 3 verification configuration
  verify: {
    etherscan: {
      apiKey: process.env.FLARESCAN_API_KEY || "any-string-works",
    },
    blockscout: {
      enabled: false
    },
    sourcify: {
      enabled: false
    }
  },
  // Chain descriptors for custom networks (Hardhat 3)
  chainDescriptors: {
    114: {
      name: "Coston2",
      blockExplorers: {
        etherscan: {
          name: "Coston2 Explorer",
          url: "https://coston2-explorer.flare.network",
          apiUrl: "https://coston2-explorer.flare.network/api",
        }
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
});
