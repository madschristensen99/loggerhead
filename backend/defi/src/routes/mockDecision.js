const express = require('express');
const router = express.Router();
const mockDecisionService = require('../services/mockDecisionService');
const tradeService = require('../services/tradeService');

/**
 * @route   GET /api/mock/decision
 * @desc    Generate a mock allocation decision
 * @access  Public
 */
router.get('/decision', (req, res) => {
  const { randomize = 'true', eurcBias = '0.5' } = req.query;
  
  const allocation = mockDecisionService.generateAllocation({
    randomize: randomize === 'true',
    eurcBias: parseFloat(eurcBias)
  });
  
  res.json({
    timestamp: new Date().toISOString(),
    allocation
  });
});

/**
 * @route   POST /api/mock/execute
 * @desc    Generate and execute a mock allocation decision
 * @access  Public
 */
router.post('/execute', async (req, res, next) => {
  try {
    const { walletId = 'mock_wallet_123', randomize = true, eurcBias = 0.5 } = req.body;
    
    // Generate allocation
    const allocation = mockDecisionService.generateAllocation({
      randomize,
      eurcBias
    });
    
    console.log(`Generated allocation: EURC: ${allocation.EURC}, USDC: ${allocation.USDC}`);
    
    // Process allocation through trade service
    const result = await tradeService.processAllocation(walletId, allocation);
    
    res.json({
      timestamp: new Date().toISOString(),
      allocation,
      tradeResult: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/mock/sequence
 * @desc    Generate and execute a sequence of mock allocation decisions
 * @access  Public
 */
router.post('/sequence', async (req, res, next) => {
  try {
    const { 
      walletId = 'mock_wallet_123', 
      count = 5, 
      trend = true, 
      trendDirection = 'oscillate' 
    } = req.body;
    
    // Generate sequence of allocations
    const sequence = mockDecisionService.generateAllocationSequence(count, { trend, trendDirection });
    
    // Process each allocation
    const results = [];
    for (const decision of sequence) {
      console.log(`Processing allocation: EURC: ${decision.allocation.EURC}, USDC: ${decision.allocation.USDC}`);
      
      const result = await tradeService.processAllocation(walletId, decision.allocation);
      results.push({
        timestamp: decision.timestamp,
        allocation: decision.allocation,
        tradeResult: result
      });
    }
    
    res.json({
      sequence: results
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
