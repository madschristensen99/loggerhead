/**
 * Test script for the automation service
 * 
 * This script tests the automation service's ability to process AI recommendations
 * and execute cross-chain trades based on those recommendations
 */
const axios = require('axios');
const walletService = require('../services/walletService');
const automationService = require('../services/automationService');
const mockDecisionService = require('../services/mockDecisionService');

// Base URL for API requests
const API_URL = 'http://localhost:3000/api';

// Load environment variables
require('dotenv').config();

// Use real test wallet ID from environment variables
const TEST_WALLET_ID = process.env.TEST_WALLET_ID;
const TEST_USER_ID = process.env.TEST_USER_ID;

/**
 * Start the automation service
 */
async function startAutomation() {
  try {
    const response = await axios.post(`${API_URL}/automation/start`);
    console.log('Automation service started:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to start automation service:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Process a single AI recommendation
 * @param {Object} recommendation - The AI recommendation
 * @param {string} walletId - The wallet ID
 * @param {boolean} forceRebalance - Whether to force a rebalance
 */
async function processRecommendation(recommendation, walletId, forceRebalance = false) {
  try {
    console.log(`\nProcessing recommendation: EURC=${recommendation.EURC}, USDC=${recommendation.USDC}`);
    
    const response = await axios.post(`${API_URL}/automation/recommendation`, {
      recommendation,
      walletId,
      forceRebalance
    });
    
    console.log('Recommendation processed:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Failed to process recommendation:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Generate and process a sequence of AI recommendations
 * @param {number} count - Number of recommendations to generate
 * @param {string} trendDirection - Direction of the trend ('up', 'down', 'oscillate')
 */
async function processSequence(count = 5, trendDirection = 'oscillate') {
  try {
    console.log(`\nGenerating and processing ${count} recommendations with ${trendDirection} trend...`);
    
    // Start with a balanced allocation
    let currentAllocation = { EURC: 0.5, USDC: 0.5 };
    
    // Process each recommendation in sequence
    for (let i = 0; i < count; i++) {
      // Generate the next recommendation based on the trend
      const recommendation = mockDecisionService.generateAllocation({
        trend: true,
        trendDirection,
        previousAllocation: currentAllocation
      });
      
      console.log(`\nRecommendation ${i + 1}/${count}:`);
      
      // Process the recommendation
      const result = await processRecommendation(recommendation, TEST_WALLET_ID);
      
      // Update the current allocation for the next iteration
      if (result.status === 'success') {
        currentAllocation = result.targetAllocation;
      }
      
      // Wait a moment before the next recommendation
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\nSequence completed!');
  } catch (error) {
    console.error('Failed to process sequence:', error);
  }
}

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
    console.error('This is likely an authentication issue with the Privy API.');
    return null;
  }
}

/**
 * Run the automation test
 */
async function runTest() {
  try {
    console.log('🐢 Loggerhead Automation Test - AI-Driven Cross-Chain Trading\n');
    
    // First test wallet service directly
    await testWalletService();
    
    // Start the automation service
    await startAutomation();
    
    // Process a single recommendation
    const singleRecommendation = { EURC: 0.7, USDC: 0.3 };
    await processRecommendation(singleRecommendation, TEST_WALLET_ID, true);
    
    // Process a sequence of recommendations with different trends
    await processSequence(3, 'up');
    await processSequence(3, 'down');
    await processSequence(3, 'oscillate');
    
    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runTest();
}

module.exports = {
  startAutomation,
  processRecommendation,
  processSequence,
  testWalletService,
  runTest
};
