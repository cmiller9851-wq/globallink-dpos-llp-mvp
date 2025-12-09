// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";

// Define a maximum number of validators to prevent unbounded gas costs on iteration
uint256 constant MAX_VALIDATORS = 100;

contract DPoSValidator is Context, Ownable {
    
    // ---------------------------------------------------------------------
    // 1. OPTIMIZED STATE VARIABLES (Storage Slot Packing)
    // ---------------------------------------------------------------------

    // Slot 1: Packs stakeToken (20 bytes), validatorCount (8 bytes), rewardFeeBasisPoints (1 byte)
    // Total used: 29 bytes. Saves 2+ full storage slots compared to using uint256 for all.
    address public stakeToken;        // The GLX-USD ERC20 token address
    uint64 public validatorCount;     // Current number of active validators (Reduced from uint256)
    uint8 public rewardFeeBasisPoints; // The fee rate charged to delegators (e.g., 500 for 5%)

    // Slot 2: address (20 bytes)
    address public immutable admin;   // The address of the MultiSig DAO

    // Mappings always occupy full 32-byte slots regardless of packing
    mapping(address => bool) public isValidator;
    mapping(address => uint256) public validatorStake; // Total stake assigned to this validator
    mapping(address => address) public delegation;     // User => Validator they delegated to

    // ---------------------------------------------------------------------
    // 2. EVENTS
    // ---------------------------------------------------------------------
    event Staked(address indexed delegator, uint256 amount, address indexed validator);
    event Unstaked(address indexed delegator, uint256 amount, address indexed validator);
    event RewardsAccrued(address indexed validator, uint256 amount);
    event RewardsClaimed(address indexed validator, uint256 amount);

    // ---------------------------------------------------------------------
    // 3. CONSTRUCTOR
    // ---------------------------------------------------------------------
    constructor(address _stakeToken, address _admin) Ownable(_admin) {
        // Sets the MultiSig wallet as the contract owner/admin
        admin = _admin;
        stakeToken = _stakeToken;
        // Set a default fee rate (e.g., 1000 basis points = 10%)
        rewardFeeBasisPoints = 1000;
    }

    // ---------------------------------------------------------------------
    // 4. TRANSACTIONAL FUNCTIONS (Optimized for Gas)
    // ---------------------------------------------------------------------

    function stake(uint256 amount, address validatorAddr) external {
        // OPTIMIZATION: Cache Storage Reads (stakeToken, validatorCount) into Memory
        address tokenAddress = stakeToken;
        uint64 currentValidatorCount = validatorCount;

        require(amount > 0, "DPoS: Stake amount must be greater than zero");
        require(validatorAddr != address(0), "DPoS: Invalid validator address");
        
        address currentDelegatedValidator = delegation[_msgSender()];
        
        // Logic for new validator registration
        if (currentDelegatedValidator == address(0)) {
            if (!isValidator[validatorAddr]) {
                require(currentValidatorCount < MAX_VALIDATORS, "DPoS: Validator set is full");
                isValidator[validatorAddr] = true;
                // Update storage once with the incremented value
                validatorCount = currentValidatorCount + 1; 
            }
            delegation[_msgSender()] = validatorAddr;
        } else {
            // Must delegate to the same validator or unstake first (MVP rule)
            require(currentDelegatedValidator == validatorAddr, 
                "DPoS: Must unstake before delegating to a new validator");
        }

        // Transfer tokens to the contract (uses cached tokenAddress)
        require(IERC20(tokenAddress).transferFrom(
                _msgSender(),
                address(this),
                amount
            ), "DPoS: Token transfer failed");

        validatorStake[validatorAddr] += amount;
        
        emit Staked(_msgSender(), amount, validatorAddr);
    }

    function unstake(uint256 amount) external {
        // OPTIMIZATION: Cache Storage Read
        address tokenAddress = stakeToken;

        address validatorAddr = delegation[_msgSender()];
        require(validatorAddr != address(0), "DPoS: Not delegated to any validator");
        require(validatorStake[validatorAddr] >= amount, "DPoS: Unstake amount exceeds delegated amount");

        // Update stake
        validatorStake[validatorAddr] -= amount;

        // Transfer tokens back to the user (uses cached tokenAddress)
        require(IERC20(tokenAddress).transfer(
                _msgSender(),
                amount
            ), "DPoS: Token transfer failed");

        // Clear delegation if stake is zero
        if (validatorStake[validatorAddr] == 0) {
            // Note: isValidator remains true until a DAO governance action removes them.
            delegation[_msgSender()] = address(0);
        }
        
        emit Unstaked(_msgSender(), amount, validatorAddr);
    }

    function claimRewards() external {
        // OPTIMIZATION: Cache Storage Read
        address tokenAddress = stakeToken;
        address validatorAddr = delegation[_msgSender()]; 

        // Placeholder for complex reward logic (to be implemented in Phase 2)
        uint256 rewards = calculateRewards(validatorAddr); // Placeholder external call/logic
        require(rewards > 0, "DPoS: No rewards available to claim");
        
        // Send rewards using the cached 'tokenAddress'
        require(IERC20(tokenAddress).transfer(
                _msgSender(),
                rewards
            ), "DPoS: Reward token transfer failed");

        emit RewardsClaimed(_msgSender(), rewards);
    }
    
    // ---------------------------------------------------------------------
    // 5. VIEW FUNCTIONS (Placeholders)
    // ---------------------------------------------------------------------

    // This function must be highly gas efficient. In the MVP, it iterates over all validators.
    // In a final design, this must be replaced by a Max-Heap or ordered list for O(1) retrieval.
    function currentProducer() public view returns (address) {
        address highestStaker = address(0);
        uint256 maxStake = 0;
        
        // NOTE: This loop is gas-expensive if validatorCount is large.
        // It should be replaced in the scaling phase.
        // For MVP simplicity, we iterate over the known validator addresses (if tracked).
        // Since we don't have a simple iterable array of validators in this MVP, 
        // this function is currently non-functional/conceptual. 
        // We return the highest staker for the current MVP purpose.
        
        // *** CONCEPTUAL LOGIC ***
        // if (validatorStake[someValidator] > maxStake) { maxStake = ... }

        return highestStaker; 
    }

    // Placeholder for reward calculation (actual logic is complex and often off-chain)
    function calculateRewards(address validatorAddr) public view returns (uint256) {
        // Simple mock return for testing the claimRewards function
        if (validatorStake[validatorAddr] > 1000) {
            return 500 * (validatorStake[validatorAddr] / 1000); 
        }
        return 0;
    }
}
