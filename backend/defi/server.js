const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrivyClient } = require('@privy-io/server-auth');
const dotenv = require('dotenv');
const axios = require('axios');
const { ethers } = require('ethers');

// Load environment variables
dotenv.config();

// Log environment variables (without secrets)
console.log('Environment loaded:');
console.log('PRIVY_API_KEY:', process.env.PRIVY_API_KEY);
console.log('PRIVY_APP_SECRET:', process.env.PRIVY_APP_SECRET);
console.log('BASE_RPC:', process.env.BASE_RPC);

// USDC token contract address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// USDC has 6 decimals
const USDC_DECIMALS = 6;

// Minimum balance threshold (2 cents = 0.02 USDC = 20000 in smallest units)
const MIN_BALANCE_THRESHOLD = 20000; // 0.02 USDC

const app = express();
const port = process.env.PORT || 4000;

// Initialize Privy client with API key and app secret from environment variables
const privy = new PrivyClient(
  process.env.PRIVY_API_KEY,
  process.env.PRIVY_APP_SECRET
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API key middleware for internal authentication
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === 'loggerhead-internal-api-key') {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Function to check USDC balance on Base for a wallet address
async function checkUSDCBalance(walletAddress) {
  try {
    // Create a provider using the Base RPC URL
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC);
    
    // Create USDC contract instance (minimal ABI for balanceOf function)
    const usdcAbi = [
      'function balanceOf(address owner) view returns (uint256)'
    ];
    const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);
    
    // Get USDC balance
    const balance = await usdcContract.balanceOf(walletAddress);
    
    return balance;
  } catch (error) {
    console.error(`Error checking USDC balance for ${walletAddress}:`, error.message);
    return ethers.parseUnits('0', USDC_DECIMALS);
  }
}

// Get all wallets endpoint
app.get('/api/wallets', apiKeyMiddleware, async (req, res) => {
  try {
    console.log('Getting all wallets...');
    
    // Method 1: Try using the SDK's getUsers method to get all users and extract wallets
    try {
      console.log('Attempting to get all users via SDK...');
      const users = await privy.getUsers();
      console.log(`Found ${users.length} users`);
      
      // Extract wallets from all users
      const allWallets = [];
      for (const user of users) {
        if (user.linkedAccounts) {
          const userWallets = user.linkedAccounts.filter(account => account.type === 'wallet');
          if (userWallets.length > 0) {
            console.log(`User ${user.id} has ${userWallets.length} wallets`);
            allWallets.push(...userWallets);
          }
        }
      }
      
      console.log(`Total wallets found: ${allWallets.length}`);
      
      // Check USDC balances on Base for each wallet
      console.log('Checking USDC balances on Base...');
      const walletsWithBalances = [];
      
      for (const wallet of allWallets) {
        const balance = await checkUSDCBalance(wallet.address);
        const balanceNumber = Number(balance);
        
        // Add balance to wallet object
        wallet.usdcBalance = balance.toString();
        wallet.usdcBalanceFormatted = ethers.formatUnits(balance, USDC_DECIMALS);
        
        // Check if balance is greater than threshold
        if (balanceNumber > MIN_BALANCE_THRESHOLD) {
          console.log(`Wallet ${wallet.address} has ${wallet.usdcBalanceFormatted} USDC (> 0.02 USDC)`);
          walletsWithBalances.push(wallet);
        }
      }
      
      console.log(`Found ${walletsWithBalances.length} wallets with USDC balance > 0.02`);
      
      return res.status(200).json({
        success: true,
        wallets: allWallets,
        walletsWithUSDCBalance: walletsWithBalances,
        count: allWallets.length,
        countWithBalance: walletsWithBalances.length
      });
    } catch (sdkError) {
      console.error('Error using SDK method:', sdkError.message);
      console.log('Falling back to direct API call...');
      
      // Method 2: Direct API call as fallback
      const response = await axios({
        method: 'GET',
        url: 'https://auth.privy.io/api/v1/wallets',
        headers: {
          'Authorization': `Bearer ${process.env.PRIVY_APP_SECRET}`,
          'Content-Type': 'application/json',
          'X-Privy-App-Id': process.env.PRIVY_API_KEY
        }
      });
      
      const wallets = response.data.wallets || [];
      
      // Check USDC balances on Base for each wallet
      console.log('Checking USDC balances on Base...');
      const walletsWithBalances = [];
      
      for (const wallet of wallets) {
        const balance = await checkUSDCBalance(wallet.address);
        const balanceNumber = Number(balance);
        
        // Add balance to wallet object
        wallet.usdcBalance = balance.toString();
        wallet.usdcBalanceFormatted = ethers.formatUnits(balance, USDC_DECIMALS);
        
        // Check if balance is greater than threshold
        if (balanceNumber > MIN_BALANCE_THRESHOLD) {
          console.log(`Wallet ${wallet.address} has ${wallet.usdcBalanceFormatted} USDC (> 0.02 USDC)`);
          walletsWithBalances.push(wallet);
        }
      }
      
      console.log(`Found ${walletsWithBalances.length} wallets with USDC balance > 0.02`);
      
      return res.status(200).json({
        success: true,
        wallets: wallets,
        walletsWithUSDCBalance: walletsWithBalances,
        count: wallets.length,
        countWithBalance: walletsWithBalances.length,
        nextCursor: response.data.next_cursor
      });
    }
  } catch (error) {
    console.error('Error getting all wallets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get all wallets',
      details: error.message || 'Unknown error'
    });
  }
});

// Get wallets with USDC balance > 0.02 endpoint
app.get('/api/wallets/with-balance', apiKeyMiddleware, async (req, res) => {
  try {
    console.log('Getting wallets with USDC balance > 0.02...');
    
    // Get all wallets
    const users = await privy.getUsers();
    
    // Extract wallets from all users
    const allWallets = [];
    for (const user of users) {
      if (user.linkedAccounts) {
        const userWallets = user.linkedAccounts.filter(account => account.type === 'wallet');
        if (userWallets.length > 0) {
          allWallets.push(...userWallets);
        }
      }
    }
    
    // Check USDC balances on Base for each wallet
    const walletsWithBalances = [];
    
    for (const wallet of allWallets) {
      const balance = await checkUSDCBalance(wallet.address);
      const balanceNumber = Number(balance);
      
      // Check if balance is greater than threshold
      if (balanceNumber > MIN_BALANCE_THRESHOLD) {
        wallet.usdcBalance = balance.toString();
        wallet.usdcBalanceFormatted = ethers.formatUnits(balance, USDC_DECIMALS);
        console.log(`Wallet ${wallet.address} has ${wallet.usdcBalanceFormatted} USDC (> 0.02 USDC)`);
        walletsWithBalances.push(wallet);
      }
    }
    
    console.log(`Found ${walletsWithBalances.length} wallets with USDC balance > 0.02`);
    
    return res.status(200).json({
      success: true,
      wallets: walletsWithBalances,
      count: walletsWithBalances.length
    });
  } catch (error) {
    console.error('Error getting wallets with balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallets with balance',
      details: error.message || 'Unknown error'
    });
  }
});

// Get wallets for a specific user
app.get('/api/wallets/:userId', apiKeyMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Get user data which includes linked accounts (wallets)
    const user = await privy.getUser(userId);
    const wallets = user.linkedAccounts.filter(account => account.type === 'wallet');
    
    res.status(200).json({
      success: true,
      wallets: wallets
    });
  } catch (error) {
    console.error(`Error getting wallets for user ${req.params.userId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user wallets',
      details: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Wallet server running on port ${port}`);
});

module.exports = app;
