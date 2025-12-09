// ... (Contract import and interface declarations remain the same) ...

contract DPoSValidator is Ownable {
    // ---------------------------------------------------------------------
    // 1. OPTIMIZED STORAGE DECLARATIONS (Gas Savings via Slot Packing)
    // ---------------------------------------------------------------------

    // Slot 1: address (20 bytes) + uint64 (8 bytes) + uint8 (1 byte)
    // Total size: 29 bytes. Leaves 3 bytes unused but packs the critical metadata.
    address public stakeToken;       // 20 bytes (The GLX-USD ERC20 token address)
    uint64 public validatorCount;    // 8 bytes (Reduced from uint256 to save 24 bytes)
    uint8 public rewardFeeBasisPoints; // 1 byte (New variable for fee rate, e.g., 500 for 5%)

    // Slot 2: address (20 bytes)
    // This is the DAO address, packed alone for simplicity, or could be packed with other small values.
    address public immutable admin; 

    // Mappings and dynamic arrays always occupy their own full 32-byte slot.
    mapping(address => bool) public isValidator;
    mapping(address => uint256) public validatorStake; // Total stake assigned to this validator
    mapping(address => address) public delegation;     // User => Validator they delegated to

    // ... (Rest of the contract mappings and functions remain the same) ...
}
