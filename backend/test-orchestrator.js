const ClaudeOrchestrator = require('./claude-orchestrator');
require('dotenv').config();

async function testOrchestrator() {
  console.log('🧪 Testing Claude AI Orchestrator...\n');

  const orchestrator = new ClaudeOrchestrator();

  try {
    // Test 1: Check available servers
    console.log('📋 Available MCP Servers:');
    const servers = orchestrator.getAvailableServers();
    console.log(servers);
    console.log('');

    // Test 2: Health check
    console.log('🏥 Health Check:');
    const health = await orchestrator.healthCheck();
    console.log(JSON.stringify(health, null, 2));
    console.log('');

    // Test 3: Test individual MCP servers
    console.log('🔍 Testing Individual MCP Servers:');
    
    // Test Perplexity
    try {
      console.log('Testing Perplexity (via CurrencyAdvisorMCP)...');
      const perplexityData = await orchestrator.mcpServers.perplexity.instance.execute();
      console.log('✅ Perplexity: Success');
      console.log(`EUR: ${perplexityData.EUR}, USD: ${perplexityData.USD}`);
      console.log(`Reasoning length: ${perplexityData.reasoning?.length || 0} characters`);
    } catch (error) {
      console.log('❌ Perplexity: Failed -', error.message);
    }

    // Test ChatGPT
    try {
      console.log('Testing ChatGPT...');
      const chatgptData = await orchestrator.mcpServers.chatgpt.instance.execute();
      console.log('✅ ChatGPT: Success');
      console.log(`EUR: ${chatgptData.EUR}, USD: ${chatgptData.USD}`);
      console.log(`Reasoning length: ${chatgptData.reasoning?.length || 0} characters`);
    } catch (error) {
      console.log('❌ ChatGPT: Failed -', error.message);
    }





    console.log('');

    // Test 4: Full orchestration (if Claude API key is available)
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('🧠 Testing Full Orchestration:');
      try {
        const result = await orchestrator.analyzeCurrencyInvestment();
        console.log('✅ Full Orchestration: Success');
        console.log('Result:', {
          EUR: result.EUR,
          USD: result.USD,
          confidenceLevel: result.confidenceLevel,
          source: result.source
        });
      } catch (error) {
        console.log('❌ Full Orchestration: Failed -', error.message);
      }
    } else {
      console.log('⚠️ Skipping full orchestration test - ANTHROPIC_API_KEY not set');
    }

    console.log('\n✅ Orchestrator test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testOrchestrator();
}

module.exports = { testOrchestrator }; 