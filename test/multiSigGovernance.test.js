describe("Security: Execution Re-run Prevention (Checks-Effects-Interactions)", function () {
    let targetContract;
    let txIndex;
    let amountToSend = ethers.utils.parseEther("1.0");

    beforeEach(async function () {
        // Assume 'multiSig', 'glxToken', 'owner1', 'owner2', 'owner3' are initialized globally/in a top-level beforeEach
        
        // 1. Deploy a simple target contract to be called by the MultiSig
        const TargetContract = await ethers.getContractFactory("TargetContract");
        targetContract = await TargetContract.deploy();
        
        // 2. Fund the MultiSig wallet to cover the transaction value
        await owner1.sendTransaction({ to: multiSig.address, value: amountToSend });
        
        // 3. Submit a transaction: send 1 ETH from MultiSig to the Target Contract
        const data = "0x"; // Empty data for a simple ETH transfer
        const submitTx = await multiSig.connect(owner1).submitTransaction(
            targetContract.address, 
            amountToSend, 
            data
        );
        const receipt = await submitTx.wait();
        // Extract the txIndex from the event
        txIndex = receipt.events.find(e => e.event === 'Submission').args.txIndex;
        
        // 4. Confirm the transaction (2 of 3 owners)
        await multiSig.connect(owner2).confirmTransaction(txIndex);
        
        // 5. Execute the transaction successfully (CRITICAL STEP 1: Execution)
        await multiSig.connect(owner3).executeTransaction(txIndex);
        
        // Verify the effect: money was sent and tx is marked executed
        expect(await ethers.provider.getBalance(targetContract.address)).to.equal(amountToSend);
    });

    it("should revert if executeTransaction is called a second time", async function () {
        // CRITICAL STEP 2: Attempt to re-execute the transaction
        await expect(
            multiSig.connect(owner3).executeTransaction(txIndex)
        ).to.be.revertedWith("MultiSig: Transaction already executed");
    });
});
