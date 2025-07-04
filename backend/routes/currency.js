var express = require('express');
var router = express.Router();

/* GET currency listing. */
// This endpoint analyzes real-time market data to determine whether EUR or USD is better for investment

const CurrencyAdvisorMCP = require('../mcp/currency-advisor');

router.get('/', async function(req, res, next) {
  try {
    console.log('🚀 Starting currency investment analysis...');
    
    const currencyAdvisor = new CurrencyAdvisorMCP();
    const result = await currencyAdvisor.execute();
    
    console.log('✅ Analysis complete, returning result:', result);
    res.json(result);
    
  } catch (err) {
    console.error('❌ Error in currency route:', err);
    next(err);
  }
});

module.exports = router;
