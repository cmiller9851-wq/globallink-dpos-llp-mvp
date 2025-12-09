// ... (Contract structure, state variables, and other functions) ...

// Mapping to track if a transaction has been executed
mapping(uint256 => bool) public isExecuted;

// ... (Other functions: submitTransaction, confirmTransaction) ...


// Function to execute a confirmed transaction
function executeTransaction(uint256 txIndex) public onlyConfirmed(txIndex) {
    Transaction storage tx = transactions[txIndex];

    // Check 1: Ensure transaction hasn't been executed
    require(!isExecuted[txIndex], "MultiSig: Transaction already executed");
    
    // Check 2: Ensure transaction is confirmed (handled by onlyConfirmed modifier)

    // ---------------------------------------------------------------------
    // 🚨 SECURITY HARDENING: Checks-Effects-Interactions
    // 
    // Effect: Update contract state (mark as executed) BEFORE the external call.
    // This prevents reentrancy via the low-level call.
    // ---------------------------------------------------------------------
    isExecuted[txIndex] = true; // <-- THE CRITICAL SECURITY STEP

    // Interaction: Perform the external call
    (bool success, bytes memory data) = tx.destination.call{value: tx.value}(tx.data);

    // After the interaction, check for success
    require(success, "MultiSig: Transaction failed during external call");

    emit Execution(txIndex);
}

// ... (Rest of the contract functions remain the same) ...
