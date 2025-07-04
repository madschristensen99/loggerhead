/**
 * Create a test wallet using Privy API
 * 
 * This script creates a new user and wallet using the Privy API
 * and outputs the wallet details for testing purposes
 */
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Privy API base URL
const PRIVY_API_BASE_URL = 'https://api.privy.io/v1';

// Test email for user creation
const TEST_EMAIL = `test-${Date.now()}@example.com`;

/**
 * Create a user using Privy API
 */
async function createUser() {
  try {
    console.log('Creating test user with Privy API...');
    
    // Create Basic Auth token (base64 of appId:appSecret)
    const basicAuthToken = Buffer.from(`${process.env.PRIVY_API_KEY}:${process.env.PRIVY_APP_SECRET}`).toString('base64');
    
    // Set up headers with Basic Auth and app ID per Privy docs
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuthToken}`,
      'privy-app-id': process.env.PRIVY_API_KEY
    };
    
    // Create user request
    const response = await axios.post(
      `${PRIVY_API_BASE_URL}/users`, 
      {
        linked_accounts: [
          {
            address: TEST_EMAIL,
            type: 'email'
          }
        ]
      },
      { headers }
    );
    
    // Log user details
    console.log('\n✅ User created successfully!\n');
    console.log('User Details:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a wallet using Privy API
 */
async function createWallet(userId) {
  try {
    console.log(`\nCreating wallet for user ${userId}...`);
    
    // Create Basic Auth token (base64 of appId:appSecret)
    const basicAuthToken = Buffer.from(`${process.env.PRIVY_API_KEY}:${process.env.PRIVY_APP_SECRET}`).toString('base64');
    
    // Set up headers with Basic Auth and app ID per Privy docs
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuthToken}`,
      'privy-app-id': process.env.PRIVY_API_KEY
    };
    
    // Create wallet request
    const response = await axios.post(
      `${PRIVY_API_BASE_URL}/wallets`, 
      {
        chain_type: 'ethereum',
        owner: { user_id: userId }
      },
      { headers }
    );
    
    // Log wallet details
    console.log('\n✅ Wallet created successfully!\n');
    console.log('Wallet Details:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Save wallet ID for future reference
    console.log('\nUse this wallet ID for testing:');
    console.log(`Wallet ID: ${response.data.id}`);
    console.log(`Address: ${response.data.address}`);
    
    return response.data;
  } catch (error) {
    console.error('Error creating wallet:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get wallet details
 * @param {string} walletId - The wallet ID
 */
async function getWalletDetails(walletId) {
  try {
    console.log(`\nFetching details for wallet ${walletId}...`);
    
    // Create Basic Auth token (base64 of appId:appSecret)
    const basicAuthToken = Buffer.from(`${process.env.PRIVY_API_KEY}:${process.env.PRIVY_APP_SECRET}`).toString('base64');
    
    // Set up headers with Basic Auth and app ID per Privy docs
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuthToken}`,
      'privy-app-id': process.env.PRIVY_API_KEY
    };
    
    // Get wallet details
    const response = await axios.get(
      `${PRIVY_API_BASE_URL}/wallets/${walletId}`,
      { headers }
    );
    
    // Log wallet details
    console.log('\n✅ Wallet details fetched successfully!\n');
    console.log('Wallet Details:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet details:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Create a new user
    const user = await createUser();
    
    if (user && user.id) {
      // Create a new wallet for the user
      const wallet = await createWallet(user.id);
      
      // Get wallet details
      if (wallet && wallet.id) {
        await getWalletDetails(wallet.id);
      }
      
      console.log('\n🎉 Test wallet setup complete!');
      console.log('\nSave these details for your automation service:');
      console.log(`User ID: ${user.id}`);
      console.log(`Wallet ID: ${wallet.id}`);
      console.log(`Wallet Address: ${wallet.address}`);
    }
  } catch (error) {
    console.error('Test wallet setup failed:', error);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  createWallet,
  getWalletDetails
};
