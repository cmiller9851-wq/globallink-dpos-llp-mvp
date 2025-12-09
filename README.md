# 🌐 GlobalLink: Decentralized Proof-of-Stake (DPoS) MVP

**Repository Name:** `globallink-dpos-llp-mvp`

**Description:** Decentralized Proof-of-Stake (DPoS) layer and Local Liquidity Provider (LLP) bridge for zero-fee cross-border stablecoin (GLX-USD) payments.

**Status:** MVP Phase Concluded, Ready for Security Auditing and Scaling.

---

## 🏗️ 1. Architecture Overview

This project implements the core financial and consensus logic for GlobalLink, splitting the system into three integrated layers. 

| Layer | Components | Governance/Control |
| :--- | :--- | :--- |
| **On-Chain Core** | `DPoSValidator.sol`, `LLP.sol`, `MultiSigWallet.sol` | **DAO-Controlled:** The **MultiSigWallet** acts as the `ADMIN_ROLE` for all core contracts. |
| **Off-Chain Services**| `llp_monitor.js`, `mock-llp-api.js` | **Real-Time Bridge:** Monitors blockchain events (`FiatPayout`) and triggers the simulated bank/fiat API via HTTP. |
| **Client SDK/UI** | `wallet.js`, `StakingDashboard.jsx` | **User Interaction:** Ethers.js module for staking, delegation, and claiming rewards. |

### Governance Structure

The system is governed by a **3-owner MultiSig DAO** with a **2-of-3 quorum** required for all administrative actions (e.g., registering new validators, funding reward pools).

---

## 🛠️ 2. Project Setup & Installation

### Prerequisites

* **Node.js** (v18+) and **npm**
* **Hardhat** (Installed locally via `npm install`)
* **Ethers.js** (Used in all off-chain and client code)

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
3.  Install dependencies for the Off-Chain Services (required for Express, Socket.io, and SQLite):
    ```bash
    npm install --prefix off-chain-service express body-parser socket.io better-sqlite3 axios
    ```
4.  **Configuration:** Before running, you must update the contract addresses (`0xYour...Address`) in the configuration sections of:
    * `off-chain-service/llp_monitor.js`
    * `off-chain-service/mock-llp-api.js`
    * `client-sdk/wallet.js`

---

## 🧪 3. Running the MVP Stack

### Step 1: Start the Local Hardhat Node

Open the **first terminal** and start the development blockchain. This provides the RPC endpoint.
```bash
npx hardhat node

Step 2: Deploy All Contracts
Open the second terminal and run the unified deployment script. This deploys the token, MultiSig, DPoS, Controller, and LLP contracts.
npx hardhat run scripts/deploy.js --network localhost

Note: Copy the deployed addresses from this output to update the configuration files listed in Section 2.
Step 3: Start Off-Chain Services
Open the third and fourth terminals to start the monitoring and API services.
Terminal 3: Start the Mock LLP API Server
node off-chain-service/mock-llp-api.js
# Should report: 🌐 Mock LLP API running on http://localhost:3001

Terminal 4: Start the Event Monitor
node off-chain-service/llp_monitor.js
# Should report: 🎧 Monitoring LLP contract... Waiting for FiatPayout events...

Step 4: Run Tests
Open the fifth terminal and execute the full test suite to verify the staking and governance logic.
npx hardhat test

📚 4. Core Contracts & SDK Reference
| Component | File Path | Key Functions |
|---|---|---|
| Consensus | contracts/DPoSValidator.sol | stake(), unstake(), currentProducer(), claimRewards() |
| Governance | contracts/MultiSigWallet.sol | submitTransaction(), confirmTransaction(), executeTransaction() |
| Fiat Bridge | contracts/LLP.sol | mintFromFiat(), swapToFiat() (Emits FiatPayout) |
| Client SDK | client-sdk/wallet.js | stake(), getGlxBalance(), showCurrentProducer() |
⚖️ 5. License
This project is licensed under the Apache License 2.0. See the LICENSE file for details.

