// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config(); // Securely load environment variables

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Define the Solidity compiler version. 
  solidity: "0.8.20",

  // Configure networks for deployment and testing
  networks: {
    // The default Hardhat Network used for development and testing
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    // The "localhost" network, commonly used when running a separate 'npx hardhat node' instance
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337, 
    },
    // Sepolia Testnet Configuration
    sepolia: {
      // Fetches the RPC URL from your .env file
      url: process.env.SEPOLIA_RPC_URL || "", 
      // Fetches the PRIVATE_KEY from your .env file
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111, // Standard Sepolia chain ID
    },
  },

  // Define paths for source files and tests, matching the repository structure
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
