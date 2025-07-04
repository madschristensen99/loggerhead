/**
 * Test script for the wallet service
 * 
 * This script tests the wallet service directly to ensure it can
 * authenticate with Privy API and fetch wallet details
 */
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import wallet service
const walletService = require('../services/walletService');

// Test wallet ID from environment variables
const TEST_WALLET_ID = process.env.TEST_WALLET_ID;
const TEST_USER_ID = process.env.TEST_USER_ID;

/**
 * Test getting wallet details
 */
async function testGetWalletDetails() {
  try {
    console.log(`Testing getWalletDetails for wallet ID: ${TEST_WALLET_ID}`);
    
    // Get wallet details
    const walletDetails = await walletService.getWalletDetails(TEST_WALLET_ID);
    
    console.log('\n✅ Successfully retrieved wallet details:');
    console.log(JSON.stringify(walletDetails, null, 2));
    
    return walletDetails;
  } catch (error) {
    console.error('\n❌ Failed to get wallet details:', error.message);
  }
}

/**
 * Test getting user wallets
 */
async function testGetUserWallets() {
  try {
    console.log(`\nTesting getUserWallets for user ID: ${TEST_USER_ID}`);
    
    // Get user wallets
    const userWallets = await walletService.getUserWallets(TEST_USER_ID);
    
    console.log('\n✅ Successfully retrieved user wallets:');
    console.log(JSON.stringify(userWallets, null, 2));
    
    return userWallets;
  } catch (error) {
    console.error('\n❌ Failed to get user wallets:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🔍 Testing Wallet Service with Privy API\n');
  
  // Test wallet service methods
  await testGetWalletDetails();
  await testGetUserWallets();
  
  console.log('\n✅ Wallet Service tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testGetWalletDetails,
  testGetUserWallets,
  runTests
};
