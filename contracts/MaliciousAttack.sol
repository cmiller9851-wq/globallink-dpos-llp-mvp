// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./DPoSValidator.sol";

// This contract is designed to receive tokens and attempt to call back 
// into the DPoSValidator.sol contract from its fallback function.
contract MaliciousAttack {
    
    // Address of the DPoSValidator contract
    DPoSValidator public dpos;

    // A flag to control whether the reentrancy attack should be active
    bool public attackActive = false;
    
    // Address of the token (GLX-USD) is assumed to be retrieved from dpos.stakeToken()
    
    constructor(address _dposAddress) {
        dpos = DPoSValidator(_dposAddress);
    }

    // This fallback function is called when tokens (like GLX-USD) are transferred 
    // to this contract, which is what happens inside dpos.unstake().
    // The attacker's goal is to call dpos.unstake() again here.
    fallback() external payable {
        if (attackActive) {
            // Reentrancy attempt: call unstake() again
            // We use the full stake amount for simplicity, but any stake amount would work.
            uint256 amountToUnstake = dpos.validatorStake(address(this));
            
            // This is the recursive call that should be blocked by the ReentrancyGuard.
            dpos.unstake(amountToUnstake);
        }
    }

    receive() external payable {}

    // Public function to trigger the initial unstake call, 
    // which starts the reentrancy sequence.
    function attackUnstake(uint256 amount) public {
        attackActive = true;
        // 1. Initial external call (will trigger fallback if DPoS transfers tokens)
        dpos.unstake(amount);
        // 2. Cleanup
        attackActive = false;
    }
}
