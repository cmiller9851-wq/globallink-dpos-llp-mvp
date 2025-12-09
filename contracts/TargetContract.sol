// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

// This contract is a simple, empty receiver used in tests 
// to ensure the MultiSigWallet.call() succeeds and transfers ETH.
contract TargetContract {
    // Allows the contract to receive ETH from the MultiSig's low-level call.
    receive() external payable {}
}
