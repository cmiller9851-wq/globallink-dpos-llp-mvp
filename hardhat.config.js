// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Define the Solidity compiler version. We'll use 0.8.20 as a modern standard.
  solidity: "0.8.20",

  // Configure networks for deployment and testing
  networks: {
    // The default Hardhat Network used for development and testing
    hardhat: {
      // Allows use of the first 20 accounts from the standard Hardhat mnemonic
      chainId: 31337,
      // For local testing, we often allow unlimited contract size
      allowUnlimitedContractSize: true,
    },
    // The "localhost" network, commonly used when running a separate 'npx hardhat node' instance
    localhost: {
      url: "http://127.0.0.1:8545",
      // Uses the same chainId as the default Hardhat network
      chainId: 31337, 
    },
    // You can add testnets (e.g., sepolia) here for real testing later
    // sepolia: {
    //   url: process.env.SEPOLIA_RPC_URL || "",
    //   accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
  },

  // Define paths for source files and tests, matching the repository structure
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
