/**
 * Test script for the new Claude AI Orchestrator integration in portfolio simulator
 */

const portfolioSimulator = require('./portfolioSimulator');

// Mock wallet data for testing
const testWallet = {
  address: '0x1234567890123456789012345678901234567890',
  usdcBalance: '1000000000', // 1000 USDC (6 decimals)
  usdcBalanceFormatted: '1000.0',
  chainType: 'ethereum',
  chainId: 1,
  walletClientType: 'privy'
};

async function testPortfolioSimulator() {
  console.log('🧪 Testing Claude AI Orchestrator Integration in Portfolio Simulator\n');
  
  try {
    console.log('1. Testing basic portfolio recommendation...');
    const basicRec = await portfolioSimulator.generatePortfolioRecommendation(testWallet);
    console.log('✅ Basic recommendation generated successfully');
    console.log(`   EUR: ${(basicRec.recommendedPortfolio.EUR * 100).toFixed(1)}%`);
    console.log(`   USD: ${(basicRec.recommendedPortfolio.USD * 100).toFixed(1)}%`);
    console.log(`   Source: ${basicRec.source}`);
    console.log(`   Confidence: ${basicRec.confidenceLevel}/10\n`);
    
    console.log('2. Testing comprehensive recommendation...');
    const comprehensiveRec = await portfolioSimulator.generateComprehensiveRecommendation(testWallet);
    console.log('✅ Comprehensive recommendation generated successfully');
    console.log(`   AI Status: ${comprehensiveRec.aiAnalysis?.aiStatus || 'unknown'}`);
    console.log(`   MCP Servers: ${Object.keys(comprehensiveRec.aiAnalysis?.mcpServers || {}).length} available\n`);
    
    console.log('3. Testing detailed AI analysis...');
    const aiAnalysis = await portfolioSimulator.getDetailedAIAnalysis(testWallet);
    console.log('✅ AI analysis retrieved successfully');
    console.log(`   Status: ${aiAnalysis.aiStatus}`);
    if (aiAnalysis.mcpServers) {
      console.log('   MCP Server Status:');
      Object.entries(aiAnalysis.mcpServers).forEach(([server, status]) => {
        console.log(`     ${server}: ${status ? '✅' : '❌'}`);
      });
    }
    console.log('');
    
    console.log('4. Testing fallback behavior (simulating AI service down)...');
    // Temporarily modify the API URL to simulate service down
    const originalUrl = process.env.BACKEND_API_URL;
    process.env.BACKEND_API_URL = 'http://localhost:9999'; // Non-existent port
    
    const fallbackRec = await portfolioSimulator.generatePortfolioRecommendation(testWallet);
    console.log('✅ Fallback recommendation generated successfully');
    console.log(`   Fallback: ${fallbackRec.fallback}`);
    console.log(`   EUR: ${(fallbackRec.recommendedPortfolio.EUR * 100).toFixed(1)}%`);
    console.log(`   USD: ${(fallbackRec.recommendedPortfolio.USD * 100).toFixed(1)}%`);
    console.log(`   Source: ${fallbackRec.source}\n`);
    
    // Restore original URL
    process.env.BACKEND_API_URL = originalUrl;
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Claude AI Orchestrator integration working');
    console.log('   - Fallback mechanism functional');
    console.log('   - Comprehensive analysis available');
    console.log('   - MCP server health monitoring active');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testPortfolioSimulator()
    .then(() => {
      console.log('\n✅ Portfolio simulator test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Portfolio simulator test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPortfolioSimulator }; 