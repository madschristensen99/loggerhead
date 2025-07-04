const express = require('express');
const router = express.Router();
const tradeService = require('../services/tradeService');

/**
 * @route   POST /api/trades/allocate
 * @desc    Process AI allocation recommendations and execute trades
 * @access  Private
 */
router.post('/allocate', async (req, res, next) => {
  try {
    const { walletId, allocation } = req.body;
    
    if (!walletId || !allocation) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Wallet ID and allocation data are required' 
      });
    }
    
    // Validate allocation format
    if (!allocation.EURC || !allocation.USDC) {
      return res.status(400).json({
        status: 'error',
        message: 'Allocation must include EURC and USDC values'
      });
    }
    
    const tradeResult = await tradeService.processAllocation(walletId, allocation);
    
    res.status(200).json({
      status: 'success',
      data: tradeResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/trades/quotes
 * @desc    Get quotes for cross-chain transfers
 * @access  Private
 */
router.get('/quotes', async (req, res, next) => {
  try {
    const { 
      srcToken, 
      dstToken, 
      srcChainKey, 
      dstChainKey, 
      srcAmount,
      srcAddress,
      dstAddress
    } = req.query;
    
    if (!srcToken || !dstToken || !srcChainKey || !dstChainKey || !srcAmount || !srcAddress || !dstAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters for quote'
      });
    }
    
    const quotes = await tradeService.getQuotes({
      srcToken,
      dstToken,
      srcChainKey,
      dstChainKey,
      srcAmount,
      srcAddress,
      dstAddress
    });
    
    res.json({
      status: 'success',
      data: quotes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/trades/execute
 * @desc    Execute a cross-chain transfer
 * @access  Private
 */
router.post('/execute', async (req, res, next) => {
  try {
    const { walletId, quoteId, privateKey } = req.body;
    
    if (!walletId || !quoteId || !privateKey) {
      return res.status(400).json({
        status: 'error',
        message: 'Wallet ID, quote ID, and private key are required'
      });
    }
    
    const result = await tradeService.executeTransfer(walletId, quoteId, privateKey);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/trades/status/:transactionId
 * @desc    Check status of a cross-chain transfer
 * @access  Private
 */
router.get('/status/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const status = await tradeService.checkTransferStatus(transactionId);
    
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
