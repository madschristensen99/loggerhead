/**
 * Debug script for the automation service
 * 
 * This script directly tests the automation service's ability to fetch wallet details
 * and process recommendations without going through the API routes
 */
const automationService = require('../services/automationService');
const walletService = require('../services/walletService');

// Load environment variables
require('dotenv').config();

// Use real test wallet ID from environment variables
const TEST_WALLET_ID = process.env.TEST_WALLET_ID;
const TEST_USER_ID = process.env.TEST_USER_ID;

/**
 * Test direct wallet service access
 */
async function testWalletService() {
  try {
    console.log('🔍 Testing Wallet Service with Privy API\n');
    
    console.log(`Testing getWalletDetails for wallet ID: ${TEST_WALLET_ID}`);
    const walletDetails = await walletService.getWalletDetails(TEST_WALLET_ID);
    console.log('\n✅ Successfully retrieved wallet details:');
    console.log(JSON.stringify(walletDetails, null, 2));
    
    return walletDetails;
  } catch (error) {
    console.error('\n❌ Failed to get wallet details:', error.message);
    throw error;
  }
}

/**
 * Test direct automation service access
 */
async function testAutomationService(walletDetails) {
  try {
    console.log('\n🔍 Testing Automation Service directly\n');
    
    // Start the automation service
    const startResult = automationService.start();
    console.log('Automation service started:', startResult);
    
    // Test _getWallet method directly
    console.log(`\nTesting _getWallet method with wallet ID: ${TEST_WALLET_ID}`);
    const wallet = await automationService._getWallet(TEST_WALLET_ID);
    console.log('\n✅ Successfully retrieved wallet via automation service:');
    console.log(JSON.stringify(wallet, null, 2));
    
    // Test processRecommendation method
    const recommendation = { EURC: 0.7, USDC: 0.3 };
    console.log(`\nTesting processRecommendation with recommendation: EURC=${recommendation.EURC}, USDC=${recommendation.USDC}`);
    
    const result = await automationService.processRecommendation(recommendation, {
      walletId: TEST_WALLET_ID,
      forceRebalance: true
    });
    
    console.log('\nRecommendation processed:');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('\n❌ Failed to test automation service:', error.message);
    throw error;
  }
}

/**
 * Run the debug test
 */
async function runDebugTest() {
  try {
    console.log('🐢 Loggerhead Automation Debug Test\n');
    
    // First test wallet service directly
    const walletDetails = await testWalletService();
    
    // Then test automation service directly
    await testAutomationService(walletDetails);
    
    console.log('\n✅ Debug test completed!');
  } catch (error) {
    console.error('\n❌ Debug test failed:', error);
  }
}

// Run the debug test
runDebugTest();
