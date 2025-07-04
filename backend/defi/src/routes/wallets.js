const express = require('express');
const router = express.Router();
const walletService = require('../services/walletService');

/**
 * @route   POST /api/wallets
 * @desc    Create a new wallet using Privy
 * @access  Private
 */
router.post('/', async (req, res, next) => {
  try {
    const { userId, chainType } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'User ID is required' 
      });
    }
    
    const wallet = await walletService.createWallet(userId, chainType || 'evm');
    
    res.status(201).json({
      status: 'success',
      data: wallet
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/wallets/:userId
 * @desc    Get user wallets
 * @access  Private
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const wallets = await walletService.getUserWallets(userId);
    
    res.json({
      status: 'success',
      data: wallets
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/wallets/:walletId/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/:walletId/balance', async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const { chainId, tokenAddress } = req.query;
    
    const balance = await walletService.getWalletBalance(walletId, chainId, tokenAddress);
    
    res.json({
      status: 'success',
      data: balance
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
