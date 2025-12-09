// client-web/src/StakingDashboard.jsx
// ---------------------------------------------------------------
// Conceptual React component demonstrating the integration of 
// wallet.js functions with a front-end UI for staking/delegation.
// ---------------------------------------------------------------
import React, { useState, useEffect } from 'react';

// NOTE: In a real project, you would need to set up WalletConnect 
// or Ethers/Web3Modal to connect to an injected provider (MetaMask).
// We'll assume the wallet is initialized here, connecting to the SDK.
import { 
    getGlxBalance, 
    stake, 
    unstake, 
    claimRewards,
    showCurrentProducer,
    getDelegationStatus
} from '../../client-sdk/wallet'; // Import the SDK

// --- Mock Validator Data (In production, this would be fetched from DPoSValidator.sol) ---
const VALIDATORS = [
    { address: '0x70997970C51812dc3A010C7d01850e0d17dc7085', name: 'AlphaNode', stake: '50,000' },
    { address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', name: 'BetaPool', stake: '35,000' },
];

function StakingDashboard() {
    const [balance, setBalance] = useState('0.00');
    const [producer, setProducer] = useState('Loading...');
    const [delegationStatus, setDelegationStatus] = useState('None');
    const [stakeAmount, setStakeAmount] = useState('');
    const [status, setStatus] = useState('Initializing connection...');

    // Fetch all initial data on component mount
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch basic read data
                const bal = await getGlxBalance();
                const currentProducer = await showCurrentProducer();
                const delegationInfo = await getDelegationStatus();
                
                // Set state variables
                setBalance(bal);
                setProducer(currentProducer);
                
                if (delegationInfo.isDelegated) {
                    setDelegationStatus(`Delegated to: ${delegationInfo.validator.substring(0, 10)}... (Total Stake: ${delegationInfo.totalValidatorStake} GLX)`);
                } else {
                    setDelegationStatus('No active delegation or self-staked.');
                }

                setStatus('Ready. Wallet data loaded.');
            } catch (error) {
                console.error("Failed to load data:", error);
                // In a real app, this error likely means MetaMask isn't connected or the RPC is down
                setStatus('Error: Check wallet connection and local node RPC.');
            }
        }
        fetchData();
        // The effect runs once on mount, mimicking a successful wallet connection
    }, []);

    // --- Interaction Handlers (Calling wallet.js SDK) ---

    const handleStake = async (validatorAddress) => {
        if (!stakeAmount || parseFloat(stakeAmount) <= 0) return setStatus('Enter a valid stake amount.');
        try {
            setStatus(`Approving and staking ${stakeAmount} GLX to ${validatorAddress.substring(0, 10)}...`);
            // This single call handles the approval and the stake transaction!
            await stake(stakeAmount, validatorAddress); 
            setStatus('✅ Staking successful. Waiting for UI refresh...');
            
            // Refresh data after successful transaction
            setBalance(await getGlxBalance()); 
            const delegationInfo = await getDelegationStatus();
            setDelegationStatus(`Delegated to: ${delegationInfo.validator.substring(0, 10)}...`);

        } catch (error) {
            console.error(error);
            setStatus(`❌ Staking failed: ${error.message || 'Transaction reverted.'}`);
        }
    };

    const handleUnstake = async () => {
        if (!stakeAmount || parseFloat(stakeAmount) <= 0) return setStatus('Enter a valid amount to unstake.');
        try {
            setStatus(`Unstaking ${stakeAmount} GLX...`);
            await unstake(stakeAmount);
            setStatus('✅ Unstaking successful. Tokens are now available.');
            setBalance(await getGlxBalance()); // Refresh balance
        } catch (error) {
            setStatus(`❌ Unstaking failed: ${error.message || 'Transaction reverted.'}`);
        }
    };
    
    const handleClaimRewards = async () => {
        try {
            setStatus(`Claiming rewards...`);
            await claimRewards();
            setStatus('✅ Rewards claimed successfully! Check your balance.');
            setBalance(await getGlxBalance()); // Refresh balance
        } catch (error) {
            setStatus(`❌ Reward claim failed: ${error.message || 'Transaction reverted.'}`);
        }
    };

    // -----------------------------------------------------------------

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>🌐 GlobalLink Staking Dashboard</h1>
            <p style={{ color: status.startsWith('Error') || status.startsWith('❌') ? 'red' : status.startsWith('Ready') || status.startsWith('✅') ? 'green' : 'blue' }}>
                **Status:** {status}
            </p>
            
            <hr />

            <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
                <h2>💰 Wallet Summary</h2>
                <p><strong>Address:</strong> {window.ethereum ? window.ethereum.selectedAddress || '0x... (Using Static Key)' : 'Not Connected'}</p>
                <p><strong>GLX Balance:</strong> {balance} GLX</p>
                <p><strong>Delegation Status:</strong> {delegationStatus}</p>
                <p><strong>Current Producer:</strong> {producer.substring(0, 10)}...</p>
            </div>

            <hr />

            <h2>🗳️ Delegate & Manage Stake</h2>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter GLX Amount"
                    style={{ padding: '8px', marginRight: '10px' }}
                />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {VALIDATORS.map((v) => (
                    <div key={v.address} style={{ border: '1px solid #007bff', padding: '10px', width: '250px' }}>
                        <h3>{v.name}</h3>
                        <p>Total Stake: **{v.stake} GLX**</p>
                        <p style={{ fontSize: '0.8em', color: '#666' }}>{v.address.substring(0, 15)}...</p>
                        <button 
                            onClick={() => handleStake(v.address)}
                            style={{ backgroundColor: '#007bff', color: 'white', padding: '8px', border: 'none', cursor: 'pointer' }}
                        >
                            Delegate {stakeAmount || '...'} GLX
                        </button>
                    </div>
                ))}
            </div>
            
            <hr />

            <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                    onClick={handleUnstake}
                    style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px', border: 'none', cursor: 'pointer' }}
                >
                    📤 Unstake {stakeAmount || '...'} GLX
                </button>
                <button 
                    onClick={handleClaimRewards}
                    style={{ backgroundColor: '#28a745', color: 'white', padding: '10px', border: 'none', cursor: 'pointer' }}
                >
                    💰 Claim Rewards
                </button>
            </div>
        </div>
    );
}

// export default StakingDashboard;
