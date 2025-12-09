describe("Security: Reentrancy Protection", function () {
    let MaliciousContract;
    let maliciousAttack;
    let initialStake = ethers.utils.parseEther("1000"); // 1000 GLX

    // We use a different account for the attacker to isolate the stake
    let attacker; 

    before(async function() {
        // Assume 'dpos', 'glxToken', 'owner1' are initialized globally/in a top-level beforeEach
        [owner1, owner2, owner3, attacker] = await ethers.getSigners();
    });

    beforeEach(async function () {
        // 1. Deploy the Malicious Attack contract
        MaliciousContract = await ethers.getContractFactory("MaliciousAttack");
        maliciousAttack = await MaliciousContract.connect(attacker).deploy(dpos.address); 
        
        // 2. Fund the attacker contract with tokens (GLX)
        // Note: Transfer from the global 'owner1' which likely holds the initial supply
        await glxToken.connect(owner1).transfer(maliciousAttack.address, initialStake.mul(2));
        
        // 3. Approve the DPoS contract to spend the attacker's tokens
        // Must connect to the signer of the malicious contract
        await glxToken.connect(attacker).approve(dpos.address, initialStake.mul(2));
        
        // 4. Malicious contract stakes to set up the attack condition
        // Stake is done by the attacker's wallet, but the tokens are pulled from the contract.
        await dpos.connect(attacker).stake(initialStake, owner1.address);
    });

    it("should prevent reentrancy during unstake() via nonReentrant modifier", async function () {
        // The attack attempts to call dpos.unstake() recursively inside its fallback function.
        // The test verifies that the ReentrancyGuard successfully blocks the second call.
        
        // The malicious contract calls attackUnstake, which triggers the initial unstake() call.
        await expect(
            maliciousAttack.connect(attacker).attackUnstake(initialStake)
        ).to.be.revertedWith("ReentrancyGuard: reentrant call");
    });
});
