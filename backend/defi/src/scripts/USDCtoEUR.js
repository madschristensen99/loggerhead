/**
 * USDCtoEUR.js - Script to swap USDC to EURC on Aerodrome DEX
 * 
 * This script:
 * 1. Loads wallet data from Privy using REST API
 * 2. Reads the allocation configuration (50% USD, 50% EUR)
 * 3. Calculates the amount of USDC to swap based on the allocation
 * 4. Approves the Aerodrome router to spend USDC
 * 5. Executes the swap on Aerodrome DEX using the Aerodrome Router contract
 */

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');

// Validate required environment variables
if (!process.env.PRIVY_API_KEY || !process.env.PRIVY_APP_SECRET || !process.env.BASE_RPC) {
  console.error('Error: Required environment variables not set');
  console.error('Please set PRIVY_API_KEY, PRIVY_APP_SECRET, and BASE_RPC');
  process.exit(1);
}

// Load allocation configuration
const allocationConfig = require('../config/allocation.json');

// Contract addresses on Base network
const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const EURC_CONTRACT_ADDRESS = '0x1aafc31091d93c3ff003cff5d2d8f7ba2e728425';

// ABIs
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

const AERODROME_ROUTER_ABI = [
  'function swapExactTokensForTokensSimple(uint amountIn, uint amountOutMin, address tokenFrom, address tokenTo, bool stable, address to, uint deadline) external returns (uint[] memory amounts)'
];

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Makes an authenticated request to Privy API
 */
async function privyRequest(method, endpoint, data = null) {
  const authString = Buffer.from(
    `${process.env.PRIVY_API_KEY}:${process.env.PRIVY_APP_SECRET}`
  ).toString('base64');
  
  try {
    const response = await axios({
      method,
      url: `https://api.privy.io/v1${endpoint}`,
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'privy-app-id': process.env.PRIVY_API_KEY
      },
      data,
      httpsAgent: new https.Agent({ keepAlive: true })
    });
    
    return response.data;
  } catch (error) {
    console.error(`Privy API Error (${method} ${endpoint}):`, error.message);
    if (error.response && error.response.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Waits for a transaction to be confirmed
 */
async function waitForTransaction(provider, txHash, maxAttempts = 30) {
  console.log(`Waiting for transaction ${txHash} to be confirmed...`);
  
  let receipt = null;
  let attempts = 0;
  
  while (!receipt && attempts < maxAttempts) {
    try {
      receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        return receipt;
      }
    } catch (e) {
      console.log('Still waiting for confirmation...');
    }
    
    await sleep(2000); // Wait 2 seconds before checking again
    attempts++;
  }
  
  if (!receipt) {
    console.log(`Transaction not confirmed after ${maxAttempts * 2} seconds`);
  }
  
  return receipt;
}

/**
 * Main function to swap USDC to EURC
 */
async function swapUSDCtoEURC() {
  try {
    console.log('Starting USDC to EURC swap process...');
    
    // Initialize provider for Base network
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC);
    console.log(`Using RPC URL: ${process.env.BASE_RPC}`);
    
    // Get wallets from our local API endpoint
    console.log('Fetching wallets from local API...');
    const walletsResponse = await axios.get('http://localhost:4000/api/wallets/all', {
      headers: {
        'x-api-key': 'loggerhead-internal-api-key'
      }
    });
    
    const walletsData = walletsResponse.data;
    
    if (!walletsData.wallets || walletsData.wallets.length === 0) {
      throw new Error('No wallets found');
    }
    
    console.log(`Found ${walletsData.wallets.length} wallets`);
    
    // Use the first wallet for this example
    const wallet = walletsData.wallets[0];
    const walletId = wallet.id;
    const walletAddress = wallet.address;
    
    console.log(`Using wallet with ID: ${walletId} and address: ${walletAddress}`);
    
    // Initialize USDC contract
    const usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS,
      ERC20_ABI,
      provider
    );
    
    // Get USDC balance
    const balance = await usdcContract.balanceOf(walletAddress);
    const usdcDecimals = await usdcContract.decimals();
    const balanceInUSDC = parseFloat(ethers.formatUnits(balance, usdcDecimals));
    
    console.log(`Wallet ${walletAddress} has ${balanceInUSDC} USDC`);
    
    if (balanceInUSDC <= 0) {
      throw new Error('Wallet has no USDC balance');
    }
    
    // Use a small fixed amount for testing (0.01 USDC)
    const amountToSwap = 0.01;
    
    console.log(`Will swap a test amount of ${amountToSwap} USDC to EURC`);
    
    // Calculate the minimum amount out (with 0.5% slippage)
    const amountOutMin = ethers.parseUnits((amountToSwap * 0.995).toFixed(6), 6);
    const amountIn = ethers.parseUnits(amountToSwap.toString(), 6);
    
    // Initialize Aerodrome router contract
    const aerodromeRouter = new ethers.Contract(
      AERODROME_ROUTER,
      AERODROME_ROUTER_ABI,
      provider
    );
    
    console.log(`Approving ${amountToSwap} USDC to be spent by Aerodrome router...`);
    
    // Prepare the approval transaction data
    const approvalData = usdcContract.interface.encodeFunctionData('approve', [
      AERODROME_ROUTER, 
      amountIn
    ]);
    
    // Send approval transaction via our local API
    console.log('Sending approval transaction...');
    const approvalResponse = await axios.post(`http://localhost:4000/api/transactions/send`, {
      walletId,
      transaction: {
        from: walletAddress,
        to: USDC_CONTRACT_ADDRESS,
        data: approvalData
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'loggerhead-internal-api-key'
      }
    });
    
    const approvalTxHash = approvalResponse.data.txHash;
    console.log(`Approval transaction sent! Hash: ${approvalTxHash}`);
    
    // Wait for approval transaction to be confirmed
    const approvalReceipt = await waitForTransaction(provider, approvalTxHash);
    
    if (!approvalReceipt) {
      console.log('Warning: Approval transaction not confirmed, but proceeding with swap...');
    }
    
    // Prepare swap parameters
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    
    // Prepare the swap transaction data
    const swapData = aerodromeRouter.interface.encodeFunctionData('swapExactTokensForTokensSimple', [
      amountIn,
      amountOutMin,
      USDC_CONTRACT_ADDRESS,
      EURC_CONTRACT_ADDRESS,
      true, // stable swap
      walletAddress,
      deadline
    ]);
    
    // Send swap transaction via our local API
    console.log('Sending swap transaction...');
    const swapResponse = await axios.post(`http://localhost:4000/api/transactions/send`, {
      walletId,
      transaction: {
        from: walletAddress,
        to: AERODROME_ROUTER,
        data: swapData
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'loggerhead-internal-api-key'
      }
    });
    
    const swapTxHash = swapResponse.data.txHash;
    console.log(`Swap transaction sent! Hash: ${swapTxHash}`);
    
    // Wait for swap transaction to be confirmed
    const swapReceipt = await waitForTransaction(provider, swapTxHash);
    
    if (!swapReceipt) {
      console.log('Swap transaction not confirmed within timeout period');
    } else {
      console.log('Swap completed successfully!');
      
      // Check EURC balance after swap
      const eurcContract = new ethers.Contract(
        EURC_CONTRACT_ADDRESS,
        ERC20_ABI,
        provider
      );
      
      const eurcBalance = await eurcContract.balanceOf(walletAddress);
      const eurcDecimals = await eurcContract.decimals();
      const eurcBalanceFormatted = ethers.formatUnits(eurcBalance, eurcDecimals);
      
      console.log(`EURC balance after swap: ${eurcBalanceFormatted} EURC`);
    }
    
  } catch (error) {
    console.error('Error in USDC to EURC swap:', error.message);
  }
}

// Execute the script
swapUSDCtoEURC();https://docs.privy.io/wallets/overview