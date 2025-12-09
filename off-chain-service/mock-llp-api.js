// off-chain-service/mock-llp-api.js
// ---------------------------------------------------------------
// Minimal mock LLP API – Express + SQLite + ethers.js + socket.io
// Simulates the bank's system for deposits and payouts.
// ---------------------------------------------------------------
const express = require("express");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const http = require("http");
const Database = require("better-sqlite3");
const { ethers } = require("ethers");

// -------------------- CONFIG --------------------
const RPC_URL = "http://127.0.0.1:8545";          // Hardhat node RPC
// !!! REPLACE THIS WITH THE ACTUAL LLP ADDRESS AFTER DEPLOYMENT !!!
const LLP_ADDRESS = "0xYourDeployedLLPContractAddress"; 
const PORT = 3001;                               // HTTP + WS port

// -------------------- SETUP --------------------
const app = express();
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } }); 

// Initialize SQLite in-memory database for ledger simulation
const db = new Database(":memory:");
db.exec(`
  CREATE TABLE payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    fiat TEXT,
    amount_wei TEXT,
    status TEXT,
    tx_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    amount_wei TEXT,
    tx_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Ethers.js helpers for the /api/deposit endpoint
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
// WARNING: Using the first signer (index 0) as the default caller for mintFromFiat
const wallet = provider.getSigner(0); 
const llpAbi = [
  "function mintFromFiat(address user, uint256 fiatAmount) external",
];
const llp = new ethers.Contract(LLP_ADDRESS, llpAbi, wallet);

// -------------------- UTILITIES --------------------
function weiToDecimal(wei) {
  // Use a big number string for accurate conversion
  return ethers.utils.formatUnits(wei.toString(), 18); 
}
function decimalToWei(dec) {
  return ethers.utils.parseUnits(dec.toString(), 18);
}

// -------------------- API ENDPOINTS --------------------

// 1️⃣ POST /api/deposit - Simulates a user depositing fiat, triggering on-chain minting
app.post("/api/deposit", async (req, res) => {
  const { user, amount, fiat } = req.body; // amount is human-readable decimal
  if (!ethers.utils.isAddress(user) || !amount || !fiat) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const amountWei = decimalToWei(amount);
    
    // Call the on-chain contract to mint GLX
    const tx = await llp.mintFromFiat(user, amountWei); 
    const receipt = await tx.wait();

    // Persist deposit record
    const stmt = db.prepare(
      "INSERT INTO deposits (user, amount_wei, tx_hash) VALUES (?,?,?)"
    );
    stmt.run(user, amountWei.toString(), receipt.transactionHash);

    res.json({ txHash: receipt.transactionHash, status: "confirmed" });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ POST /api/payout - Called by llp_monitor.js upon FiatPayout event
app.post("/api/payout", (req, res) => {
  const { user, fiat, amountWei, txHash } = req.body; // amountWei is string from event
  
  if (!user || !fiat || !amountWei || !txHash) {
     return res.status(400).json({ error: "Invalid payout event payload" });
  }

  try {
    const stmt = db.prepare(
      "INSERT INTO payouts (user, fiat, amount_wei, status, tx_hash) VALUES (?,?,?,?,?)"
    );
    const result = stmt.run(user, fiat, amountWei, "pending", txHash);
    const payoutId = result.lastInsertRowid;
    
    console.log(`[LLP API] Payout #${payoutId} for ${weiToDecimal(amountWei)} ${fiat} created (PENDING).`);
    
    // Notify connected UIs via WebSocket
    io.emit("payoutStatus", { 
        id: payoutId, 
        status: "pending", 
        user, 
        fiat, 
        amount: weiToDecimal(amountWei) 
    });
    
    res.json({ payoutId, status: "pending" });
  } catch (err) {
    console.error("Payout creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ POST /api/payout/:id/confirm - Simulates Bank API success
app.post("/api/payout/:id/confirm", (req, res) => {
  const { id } = req.params;
  
  const stmt = db.prepare("UPDATE payouts SET status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'");
  const info = stmt.run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Payout not found or already processed" });
  }
  
  // Notify connected clients
  io.emit("payoutStatus", { id: parseInt(id), status: "sent" });
  console.log(`[LLP API] Payout #${id} confirmed and SENT.`);

  res.json({ status: "sent", id: parseInt(id) });
});

// -------------------- SERVER START --------------------
server.listen(PORT, () => {
  if (LLP_ADDRESS === "0xYourDeployedLLPContractAddress") {
    console.log(`\n⚠️ WARNING: Please replace the LLP_ADDRESS placeholder in the config before use.`);
  }
  console.log(`\n🌐 Mock LLP API running on http://localhost:${PORT}`);
  console.log(`   (SQLite Ledger active in memory)`);
});
