const axios = require('axios');
const { ethers } = require('ethers');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Privy API base URL
const PRIVY_API_BASE_URL = 'https://api.privy.io/v1';

// Get Privy credentials from environment variables
const PRIVY_API_KEY = process.env.PRIVY_API_KEY;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

// Validate required environment variables
if (!PRIVY_API_KEY || !PRIVY_APP_SECRET) {
  console.error('Missing required environment variables: PRIVY_API_KEY and/or PRIVY_APP_SECRET');
}

/**
 * Service to handle wallet operations using Privy API
 */
class WalletService {
  constructor() {
    this.apiKey = PRIVY_API_KEY;
    this.appSecret = PRIVY_APP_SECRET;
    
    console.log('WalletService initialized with:');
    console.log(`API Key: ${this.apiKey ? this.apiKey.substring(0, 5) + '...' : 'undefined'}`);
    console.log(`App Secret: ${this.appSecret ? this.appSecret.substring(0, 5) + '...' : 'undefined'}`);
    
    // Create Basic Auth token (base64 of appId:appSecret)
    const basicAuthToken = Buffer.from(`${this.apiKey}:${this.appSecret}`).toString('base64');
    
    // Set up headers with Basic Auth and app ID per Privy docs
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuthToken}`,
      'privy-app-id': this.apiKey
    };
  }

  /**
   * Create a new wallet for a user
   * @param {string} userId - The user ID to set as the owner of the wallet
   * @param {string} chainType - Chain type of the wallet to create (default: 'ethereum')
   * @returns {Promise<Object>} - The created wallet data
   */
  async createWallet(userId, chainType = 'ethereum') {
    try {
      const response = await axios.post(
        `${PRIVY_API_BASE_URL}/wallets`, 
        {
          chain_type: chainType,
          owner: { user_id: userId }
        },
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating wallet:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create wallet');
    }
  }

  /**
   * Get all wallets for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - Array of user wallets
   */
  async getUserWallets(userId) {
    try {
      console.log(`Fetching wallets for user ID: ${userId}`);
      
      // Fetch all wallets without filtering
      const url = `${PRIVY_API_BASE_URL}/wallets`;
      console.log(`Making request to: ${url}`);
      
      const response = await axios.get(url, { headers: this.headers });
      
      // Log the full response to understand its structure
      console.log('API response:', JSON.stringify(response.data, null, 2));
      
      // The API returns wallets in a 'data' array
      let allWallets = [];
      if (response.data && Array.isArray(response.data.data)) {
        allWallets = response.data.data;
      } else if (Array.isArray(response.data)) {
        allWallets = response.data;
      } else if (typeof response.data === 'object' && !response.data.data) {
        // If it's a single wallet object
        allWallets = [response.data];
      }
      
      // Filter wallets by owner ID client-side
      const userWallets = allWallets.filter(wallet => {
        // Check if the wallet has an owner_id property and if it matches our user ID
        // or if the wallet was created for this user in some other way
        return wallet.owner_id === userId || 
               (wallet.owner && wallet.owner.user_id === userId);
      });
      
      console.log(`Found ${userWallets.length} wallets for user ${userId}`);
      console.log('User wallets:', JSON.stringify(userWallets, null, 2));
      
      return userWallets;
    } catch (error) {
      console.error('Error fetching user wallets:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error message:', error.message);
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch user wallets');
    }
  }

  /**
   * Get wallet balance for a specific token
   * @param {string} walletId - The wallet ID
   * @param {string} chainId - The chain ID
   * @param {string} tokenAddress - The token address (optional for native token)
   * @returns {Promise<Object>} - The wallet balance data
   */
  async getWalletBalance(walletId, chainId, tokenAddress) {
    try {
      let url = `${PRIVY_API_BASE_URL}/wallets/${walletId}/balance?chain_id=${chainId}`;
      
      if (tokenAddress) {
        url += `&token_address=${tokenAddress}`;
      }
      
      const response = await axios.get(url, { headers: this.headers });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet balance:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch wallet balance');
    }
  }
  
  /**
   * Get wallet details by wallet ID
   * @param {string} walletId - The wallet ID
   * @returns {Promise<Object>} - The wallet details
   */
  async getWalletDetails(walletId) {
    try {
      console.log(`Fetching wallet details for wallet ID: ${walletId}`);
      console.log('Using headers:', JSON.stringify(this.headers, null, 2));
      
      const response = await axios.get(
        `${PRIVY_API_BASE_URL}/wallets/${walletId}`,
        { headers: this.headers }
      );
      
      console.log('Wallet details fetched successfully:', JSON.stringify(response.data, null, 2));
      
      // For testing purposes, add a mock private key if in development mode
      if (process.env.NODE_ENV === 'development') {
        response.data.privateKey = process.env.TEST_WALLET_PRIVATE_KEY || 
          '0x0000000000000000000000000000000000000000000000000000000000000001';
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet details:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error message:', error.message);
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch wallet details');
    }
  }
}

module.exports = new WalletService();
