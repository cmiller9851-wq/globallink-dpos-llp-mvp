// client-sdk/wallet.js
// ---------------------------------------------------------------
// Simple ethers.js wrapper for GlobalLink DPoS & LLP interactions
// Abstracts all contract and ABI details for easy integration.
// ---------------------------------------------------------------
const { ethers } = require("ethers");

// ---------- CONFIG ----------
const RPC_URL = "http://127.0.0.1:8545";               // Hardhat local node or testnet RPC
// !!! REPLACE PLACEHOLDERS WITH DEPLOYED ADDRESSES !!!
const DPOS_ADDRESS = "0xYourDPoSValidatorAddress";   
const LLP_ADDRESS = "0xYourLLPContractAddress";      
const PRIVATE_KEY = "0xYourPrivateKey";              // User wallet – NEVER commit a real key

// ---------- ABIs ----------
const dposAbi = [
  "function stake(uint256 amount, address validator) external",
  "function unstake(uint256 amount) external",
  "function claimRewards() external",
  "function currentProducer() view returns (address)",
  "function validatorStake(address) view returns (uint256)",
  "function delegation(address) view returns (address)",
  "function stakeToken() view returns (address)", 
  "event Staked(address indexed delegator, uint256 amount, address indexed validator)",
  "event Unstaked(address indexed delegator, uint256 amount, address indexed validator)",
  "event RewardsAccrued(address indexed validator, uint256 amount)",
  "event RewardsClaimed(address indexed validator, uint256 amount)"
];

const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// ---------- INITIALISE ----------
// Note: In a UI, 'provider' and 'wallet' would be initialized using MetaMask/WalletConnect
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const dpos = new ethers.Contract(DPOS_ADDRESS, dposAbi, wallet);

console.log(`\n🔑 Wallet initialized: ${wallet.address}`);

// ---------------------------------------------------------------------
// Helper – fetch the GLX-USD token address from the DPoS contract
// ---------------------------------------------------------------------
async function getTokenAddress() {
  return await dpos.stakeToken(); 
}

// ---------------------------------------------------------------------
// Core token helpers (uses the ERC20 ABI)
// ---------------------------------------------------------------------
async function getGlxBalance() {
  const tokenAddr = await getTokenAddress();
  const token = new ethers.Contract(tokenAddr, erc20Abi, provider);
  const bal = await token.balanceOf(wallet.address);
  const decimals = await token.decimals();
  return ethers.utils.formatUnits(bal, decimals);
}

async function approveGlx(amount) {
  const tokenAddr = await getTokenAddress();
  const token = new ethers.Contract(tokenAddr, erc20Abi, wallet);
  const decimals = await token.decimals();
  const wei = ethers.utils.parseUnits(amount.toString(), decimals);

  console.log(`\n⏳ Approving ${amount} GLX for DPoS contract...`);
  const tx = await token.approve(DPOS_ADDRESS, wei);
  await tx.wait();
  console.log(`✅ Approved ${amount} GLX – Tx: ${tx.hash}`);
}

// ---------------------------------------------------------------------
// Staking / Unstaking (uses the DPoS ABI)
// ---------------------------------------------------------------------
async function stake(amount, validatorAddr) {
  const tokenAddr = await getTokenAddress();
  const token = new ethers.Contract(tokenAddr, erc20Abi, wallet);
  const decimals = await token.decimals();
  const wei = ethers.utils.parseUnits(amount.toString(), decimals);

  // Auto-approve if allowance is too low
  const allowance = await token.allowance(wallet.address, DPOS_ADDRESS);
  if (allowance.lt(wei)) {
    console.log("⚠️ Insufficient allowance – auto-approving now");
    await approveGlx(amount);
  }

  console.log(`\n⏳ Staking ${amount} GLX to validator ${validatorAddr}...`);
  const tx = await dpos.stake(wei, validatorAddr);
  const receipt = await tx.wait();
  console.log(`📥 Staked ${amount} GLX – Tx hash: ${receipt.transactionHash}`);
}

async function unstake(amount) {
  const tokenAddr = await getTokenAddress();
  const token = new ethers.Contract(tokenAddr, erc20Abi, provider);
  const decimals = await token.decimals();
  const wei = ethers.utils.parseUnits(amount.toString(), decimals);

  console.log(`\n⏳ Unstaking ${amount} GLX...`);
  const tx = await dpos.unstake(wei);
  const receipt = await tx.wait();
  console.log(`📤 Unstaked ${amount} GLX – Tx hash: ${receipt.transactionHash}`);
}

// ---------------------------------------------------------------------
// Rewards (uses the DPoS ABI)
// ---------------------------------------------------------------------
async function claimRewards() {
  console.log("\n⏳ Claiming accrued rewards...");
  const tx = await dpos.claimRewards();
  const receipt = await tx.wait();
  console.log(`💰 Rewards claimed – Tx hash: ${receipt.transactionHash}`);
}

// ---------------------------------------------------------------------
// Status helpers (uses the DPoS ABI)
// ---------------------------------------------------------------------
async function showCurrentProducer() {
  const prod = await dpos.currentProducer();
  console.log(`\n🏆 Current Producer (highest stake): ${prod}`);
  return prod;
}

async function getDelegationStatus() {
  const validator = await dpos.delegation(wallet.address);
  
  // Note: validatorStake returns the stake *of the validator*, not the user's delegated stake.
  // We'll proceed with the original logic for simplicity, assuming a common use case.
  const stake = await dpos.validatorStake(validator); 
  const formattedStake = ethers.utils.formatEther(stake);

  const status = {
    validator: validator,
    totalValidatorStake: formattedStake,
    isDelegated: validator !== ethers.constants.AddressZero
  };
  return status;
}

// ---------------------------------------------------------------------
// Exported Module Functions
// ---------------------------------------------------------------------
module.exports = {
  getGlxBalance,
  approveGlx,
  stake,
  unstake,
  claimRewards,
  showCurrentProducer,
  getDelegationStatus,
};
