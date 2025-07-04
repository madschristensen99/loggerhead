/**
 * Startup script for Loggerhead application
 */
const app = require('./src/index');
const mockDecisionService = require('./src/services/mockDecisionService');

// Display welcome message
console.log('\n🐢 Loggerhead Server - AI-Driven Cross-Chain Trading\n');

// Generate and log a mock allocation
const allocation = mockDecisionService.generateAllocation({ randomize: false });
console.log('Mock AI Decision Output:');
console.log(JSON.stringify(allocation, null, 2));

// Generate a sequence of allocations with a trend
console.log('\nMock AI Decision Sequence (trending up):');
const sequence = mockDecisionService.generateAllocationSequence(3, { 
  trend: true, 
  trendDirection: 'up' 
});

sequence.forEach((decision, index) => {
  console.log(`\nDecision ${index + 1} at ${decision.timestamp}:`);
  console.log(JSON.stringify(decision.allocation, null, 2));
});

console.log('\n✅ Server is running!');
console.log('📊 Access the dashboard at http://localhost:3000/dashboard');
console.log('🔍 API documentation at http://localhost:3000\n');
