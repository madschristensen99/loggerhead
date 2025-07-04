/**
 * Demo script to run the Loggerhead application with mock data
 */
const mockDecisionService = require('../services/mockDecisionService');
const tradeService = require('../services/tradeService');

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

console.log('\nServer is running. Access the dashboard at http://localhost:3000/dashboard');
