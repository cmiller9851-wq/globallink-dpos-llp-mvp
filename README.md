# 🌐 GlobalLink: Decentralized Proof-of-Stake (DPoS) MVP

**Repository Name:** `globallink-dpos-llp-mvp`

**Description:** Decentralized Proof-of-Stake (DPoS) layer and Local Liquidity Provider (LLP) bridge for zero-fee cross-border stablecoin (GLX-USD) payments.

**Status:** Security Hardened, Gas Optimized, and Ready for Testnet Deployment.

---

## 🏗️ 1. Architecture Overview

This project implements the core financial and consensus logic for GlobalLink, secured by a **Reentrancy Guard** on all transactional functions (`stake`, `unstake`, `claimRewards`). 

| Layer | Contracts | Security/Governance |
| :--- | :--- | :--- |
| **On-Chain Core** | `DPoSValidator.sol`, `LLP.sol`, `MultiSigWallet.sol` | **Security:** ReentrancyGuard implemented. **Governance:** 2-of-3 MultiSig DAO. |
| **Off-Chain Services**| `llp_monitor.js`, `mock-llp-api.js` | Monitors `FiatPayout` events to trigger mock fiat API calls. |
| **Client SDK/UI** | `wallet.js`, `StakingDashboard.jsx` | Ethers.js module for user staking, delegation, and claiming rewards. |

---

## 🛠️ 2. Project Setup & Installation

### Prerequisites

* **Node.js** (v18+) and **npm**
* **Hardhat** (Installed locally via `npm install`)
* **A Funded Wallet** (For Sepolia deployment)
* **Sepolia RPC URL** (From Alchemy/Infura)

### Installation Steps

1.  Clone the repository:
    ```bash
    git clone [https://github.com/](https://github.com/)[YOUR_USER]/globallink-dpos-llp-mvp.git
    cd globallink-dpos-llp-mvp
    ```
2.  Install all project dependencies:
    ```bash
    npm install
    ```
3.  Install dependencies for the Off-Chain Services:
    ```bash
    npm install --prefix off-chain-service express body-parser socket.io better-sqlite3 axios
    ```
4.  **Create `.env` file:** Create a file named `.env` in the root directory (make sure it's in `.gitignore`) and add your network credentials:
    ```
    SEPOLIA_RPC_URL="[https://eth-sepolia.g.alchemy.com/v2/](https://eth-sepolia.g.alchemy.com/v2/)[YOUR_API_KEY]"
    PRIVATE_KEY="YOUR_DEPLOYMENT_WALLET_PRIVATE_KEY"
    ```
5.  **Configuration:** Update the contract addresses in the off-chain service files after deployment.

---

## 🚀 3. Testnet Deployment (Sepolia)

Use the unified deployment script (`scripts/deploy.js`) to deploy all core contracts (GLX Token, MultiSig, DPoS, LLP) to the Sepolia testnet.

```bash
# Deploys using the credentials provided in the .env file
npx hardhat run scripts/deploy.js --network sepolia

Note: This command will incur gas fees on Sepolia.
🧪 4. Local MVP Testing
For local development, use the following steps.
Step 1: Start the Local Hardhat Node
Open the first terminal to start the development blockchain.
npx hardhat node

Step 2: Deploy All Contracts (Local)
Open the second terminal and run the deployment script targeting the local network.
npx hardhat run scripts/deploy.js --network localhost

Step 3: Run Off-Chain Services
Start the services required for monitoring fiat payments.
# Terminal 3: Start the Mock LLP API Server
node off-chain-service/mock-llp-api.js

# Terminal 4: Start the Event Monitor
node off-chain-service/llp_monitor.js

Step 4: Run Tests
Execute the full test suite, including security and reentrancy tests.
npx hardhat test

📚 5. Core Contracts & SDK Reference
| Component | File Path | Key Functions |
|---|---|---|
| Consensus | contracts/DPoSValidator.sol | stake(), unstake(), claimRewards() (All protected by nonReentrant) |
| Governance | contracts/MultiSigWallet.sol | executeTransaction() (Uses Checks-Effects-Interactions) |
| Fiat Bridge | contracts/LLP.sol | mintFromFiat(), swapToFiat() (Emits FiatPayout) |
| Client SDK | client-sdk/wallet.js | stake(), getGlxBalance(), showCurrentProducer() |
⚖️ 6. License
This project is licensed under the Apache License 2.0. See the LICENSE file for details.
