// off-chain-service/llp_monitor.js
// ---------------------------------------------------------------
// Node.js script using ethers.js to listen for FiatPayout events
// from the LLP.sol contract and trigger the mock LLP API via HTTP.
// ---------------------------------------------------------------
const { ethers } = require("ethers");
const axios = require("axios");

// --- CONFIGURATION ---
const RPC_URL = "http://127.0.0.1:8545"; // Must match your Hardhat node RPC
// !!! REPLACE THIS WITH THE ACTUAL LLP ADDRESS AFTER DEPLOYMENT !!!
const LLP_CONTRACT_ADDRESS = "0xYourDeployedLLPContractAddress"; 
const LLP_API_URL = "http://localhost:3001/api/payout"; // Mock API endpoint

// The ABI Fragment containing the event signature
const LLP_ABI_FRAGMENT = [
    "event FiatPayout(address indexed user, string fiat, uint256 amount)"
];

// -----------------------------------------------------------------
// 1️⃣ Setup Ethers Provider and Contract Instance
// -----------------------------------------------------------------
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const llpContract = new ethers.Contract(LLP_CONTRACT_ADDRESS, LLP_ABI_FRAGMENT, provider);

function weiToDecimal(wei) {
  // Assuming 18 decimals for GLX-USD
  return ethers.utils.formatUnits(wei, 18); 
}

// -----------------------------------------------------------------
// 2️⃣ Event Listener Logic
// -----------------------------------------------------------------
function listenForPayoutEvents() {
    console.log(`\n🎧 Monitoring LLP contract: ${LLP_CONTRACT_ADDRESS}`);
    console.log(`📡 Connected to RPC: ${RPC_URL}`);

    // The contract.on() method sets up the real-time listener
    llpContract.on("FiatPayout", async (user, fiat, amountWei, event) => {
        const amountDecimal = weiToDecimal(amountWei);

        console.log(`\n🚨 FiatPayout Event Detected (Tx: ${event.transactionHash.substring(0, 10)}...)`);
        console.log(`   User: ${user}`);
        console.log(`   Amount: ${amountDecimal} GLX for ${fiat}`);

        try {
            // Send the payout request to the mock LLP API service
            const response = await axios.post(LLP_API_URL, {
                user: user,
                fiat: fiat,
                amountWei: amountWei.toString(), // Pass as string to preserve precision
                txHash: event.transactionHash
            });

            console.log(`   ✅ API Triggered: Payout ID #${response.data.payoutId} created in LLP ledger.`);
        } catch (error) {
            console.error(`   ❌ Failed to trigger LLP API: ${error.message}`);
            // In a real system, logging and retry mechanisms would be here
        }
    });

    console.log("Waiting for FiatPayout events...\n");
}

// -----------------------------------------------------------------
// 3️⃣ Start Monitoring
// -----------------------------------------------------------------
// Check if the contract address has been updated before starting
if (LLP_CONTRACT_ADDRESS === "0xYourDeployedLLPContractAddress") {
    console.error("\n❌ ERROR: Please replace '0xYourDeployedLLPContractAddress' in the script with the actual deployed LLP address before running.");
    process.exit(1);
} else {
    listenForPayoutEvents();
}
