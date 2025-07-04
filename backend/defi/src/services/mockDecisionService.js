/**
 * Mock Decision Service
 * Simulates an AI agent that provides allocation recommendations between EURC and USDC
 */
class MockDecisionService {
  /**
   * Generate a mock allocation decision
   * @param {Object} options - Optional parameters to influence the decision
   * @param {boolean} options.randomize - Whether to randomize the allocation or use fixed values
   * @param {number} options.eurcBias - Bias towards EURC (0-1), default is 0.5 (neutral)
   * @returns {Object} - The allocation recommendation {EURC: number, USDC: number}
   */
  generateAllocation(options = {}) {
    const { randomize = true, eurcBias = 0.5 } = options;
    
    if (!randomize) {
      // Fixed allocation for testing
      return {
        EURC: 0.7,
        USDC: 0.3
      };
    }
    
    // Generate a random allocation with the given bias
    let eurcAllocation = Math.random();
    
    // Apply bias (higher bias means more EURC allocation)
    eurcAllocation = (eurcAllocation + eurcBias) / 2;
    
    // Ensure allocation is between 0 and 1
    eurcAllocation = Math.max(0, Math.min(1, eurcAllocation));
    
    // Round to 2 decimal places
    eurcAllocation = Math.round(eurcAllocation * 100) / 100;
    
    return {
      EURC: eurcAllocation,
      USDC: Math.round((1 - eurcAllocation) * 100) / 100
    };
  }
  
  /**
   * Generate a sequence of allocation decisions over time
   * @param {number} count - Number of decisions to generate
   * @param {Object} options - Options for the decision generation
   * @param {boolean} options.trend - Whether to simulate a trend (default: false)
   * @param {string} options.trendDirection - Direction of trend ('up', 'down', 'oscillate')
   * @returns {Array<Object>} - Array of allocation decisions
   */
  generateAllocationSequence(count, options = {}) {
    const { trend = false, trendDirection = 'oscillate' } = options;
    const sequence = [];
    
    let eurcBias = 0.5;
    const step = 0.1;
    
    for (let i = 0; i < count; i++) {
      if (trend) {
        switch (trendDirection) {
          case 'up':
            eurcBias = Math.min(0.9, eurcBias + step);
            break;
          case 'down':
            eurcBias = Math.max(0.1, eurcBias - step);
            break;
          case 'oscillate':
            eurcBias = 0.5 + 0.4 * Math.sin(i / (count / Math.PI));
            break;
        }
      }
      
      sequence.push({
        timestamp: new Date(Date.now() + i * 3600000).toISOString(), // 1 hour intervals
        allocation: this.generateAllocation({ randomize: true, eurcBias })
      });
    }
    
    return sequence;
  }
}

module.exports = new MockDecisionService();
