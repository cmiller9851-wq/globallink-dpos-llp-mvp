// scripts/deploy.js
// ---------------------------------------------------------------
// Deploys the entire GlobalLink MVP stack in a single run:
// ERC20Mock -> MultiSigWallet -> LLP -> Controller -> DPoSValidator
//
// Crucially, the MultiSigWallet is set as the ADMIN_ROLE for the
// Controller, LLP, and DPoSValidator contracts.
// ---------------------------------------------------------------
const { ethers } = require("hardhat");

// --- CONFIGURATION ---
const INITIAL_SUPPLY = ethers.utils.parseEther("1000000"); // 1 Million GLX
const REQUIRED_CONFIRMATIONS = 2; // For 2-of-3 DAO

async function main() {
  console.log("🚀 Starting GlobalLink MVP Deployment...");

  // 1️⃣ Get Signers and Define DAO Owners
  const [deployer, owner1, owner2, owner3] = await ethers.getSigners();
  const owners = [owner1.address, owner2.address, owner3.address];
  console.log(`\nDeployer: ${deployer.address}`);
  console.log(`DAO Owners: ${owners.slice(0, 3).join(', ')}`);
  console.log(`DAO Quorum: ${REQUIRED_CONFIRMATIONS}-of-3`);
  
  // -----------------------------------------------------------------
  // 2️⃣ Deploy the MultiSigWallet
  // -----------------------------------------------------------------
  const MultiSig = await ethers.getContractFactory("MultiSigWallet");
  const multiSig = await MultiSig.deploy(owners, REQUIRED_CONFIRMATIONS);
  await multiSig.deployed();
  const multiSigAddress = multiSig.address;
  console.log(`\n✅ MultiSigWallet (DAO Admin) deployed at: ${multiSigAddress}`);

  // -----------------------------------------------------------------
  // 3️⃣ Deploy the GLX-USD Token (ERC20Mock)
  // -----------------------------------------------------------------
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const glx = await ERC20Mock.deploy("GLX USD Settlement", "GLX", INITIAL_SUPPLY);
  await glx.deployed();
  const glxAddress = glx.address;
  console.log(`✅ ERC20Mock (GLX-USD) deployed at: ${glxAddress}`);

  // -----------------------------------------------------------------
  // 4️⃣ Deploy the Core Contracts, passing MultiSig as the Admin
  // -----------------------------------------------------------------

  // 4a. Deploy Controller
  const Controller = await ethers.getContractFactory("Controller");
  const controller = await Controller.deploy(glxAddress, multiSigAddress); // token, admin
  await controller.deployed();
  const controllerAddress = controller.address;
  console.log(`✅ Controller deployed at: ${controllerAddress}`);

  // 4b. Deploy LLP
  const LLP = await ethers.getContractFactory("LLP");
  const llp = await LLP.deploy(glxAddress, multiSigAddress); // token, admin
  await llp.deployed();
  const llpAddress = llp.address;
  console.log(`✅ LLP deployed at: ${llpAddress}`);

  // 4c. Deploy DPoSValidator
  const DPoSValidator = await ethers.getContractFactory("DPoSValidator");
  const dpos = await DPoSValidator.deploy(glxAddress, multiSigAddress); // token, admin
  await dpos.deployed();
  const dposAddress = dpos.address;
  console.log(`✅ DPoSValidator deployed at: ${dposAddress}`);

  // -----------------------------------------------------------------
  // 5️⃣ Final Configuration: Transfer Minter/Admin Roles (if necessary)
  // -----------------------------------------------------------------
  // In a production setup, the GLX token should be minter-restricted.
  // Assuming ERC20Mock has transferOwnership, we pass it to the Controller.
  try {
      if (await glx.owner() !== controllerAddress) {
          // This ensures only the DAO-controlled Controller can mint/burn GLX
          await glx.transferOwnership(controllerAddress);
          console.log(`\n🔑 Transferred GLX ownership to Controller (${controllerAddress}).`);
      }
  } catch (error) {
      console.log("\n⚠️ Note: Could not transfer GLX ownership (ERC20Mock might not have transferOwnership). Skipping step.");
  }


  console.log("\n✨ MVP Deployment Complete. The system is governed by the MultiSigWallet.");
  console.log("------------------------------------------------------------------\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
