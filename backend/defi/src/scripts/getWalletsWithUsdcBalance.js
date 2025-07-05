const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

// USDC contract address on Base network
const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// USDC ABI - only what we need for balanceOf
const USDC_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Use the BASE_RPC environment variable
const BASE_RPC_URL = process.env.BASE_RPC || 'https://mainnet.base.org';

// Minimum USDC balance in cents (2 cents)
const MIN_BALANCE_CENTS = 2;

// Sleep function to add delay between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches all wallets with USDC balance greater than the minimum threshold
 */
async function getWalletsWithUsdcBalance() {
  try {
    console.log('Fetching all wallets...');
    
    // Get all wallets from our API
    const response = await axios.get('http://localhost:4000/api/wallets/all', {
      headers: {
        'x-api-key': 'loggerhead-internal-api-key'
      }
    });
    
    if (!response.data.success) {
      throw new Error('Failed to fetch wallets');
    }
    
    const wallets = response.data.wallets;
    console.log(`Found ${wallets.length} wallets. Checking USDC balances...`);
    
    // Check only the first few wallets (skip the last 25)
    const walletsToCheck = wallets.slice(0, 5);
    console.log(`Checking only the first ${walletsToCheck.length} wallets...`);
    
    // Initialize ethers provider for Base network
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    console.log(`Using RPC URL: ${BASE_RPC_URL}`);
    
    // Initialize USDC contract
    const usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS,
      USDC_ABI,
      provider
    );
    
    // Check balance for each wallet
    const walletsWithBalance = [];
    
    for (const wallet of walletsToCheck) {
      try {
        // Get USDC balance
        const balance = await usdcContract.balanceOf(wallet.address);
        
        // USDC has 6 decimals
        const balanceInUSDC = parseFloat(ethers.formatUnits(balance, 6));
        const balanceInCents = balanceInUSDC * 100;
        
        if (balanceInCents > MIN_BALANCE_CENTS) {
          walletsWithBalance.push({
            address: wallet.address,
            owner_id: wallet.owner_id,
            balance_usdc: balanceInUSDC,
            balance_cents: balanceInCents
          });
          
          console.log(`Wallet ${wallet.address} has ${balanceInUSDC} USDC`);
        }
        
        // Add a small delay between requests to avoid rate limiting
        await sleep(500);
      } catch (error) {
        console.error(`Error checking balance for wallet ${wallet.address}:`, error.message);
        // Still add a delay even if there was an error
        await sleep(500);
      }
    }
    
    console.log('\n--- RESULTS ---');
    console.log(`Found ${walletsWithBalance.length} wallets with USDC balance > ${MIN_BALANCE_CENTS} cents`);
    
    // Sort by balance (highest first)
    walletsWithBalance.sort((a, b) => b.balance_usdc - a.balance_usdc);
    
    // Display results
    console.table(walletsWithBalance);
    
    return walletsWithBalance;
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}

// Run the function
getWalletsWithUsdcBalance();
