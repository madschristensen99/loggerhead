/**
 * Automation Routes
 * 
 * API endpoints for handling AI recommendations and automated trading
 */
const express = require('express');
const router = express.Router();
const automationService = require('../services/automationService');

// Start the automation service
router.post('/start', (req, res) => {
  const result = automationService.start();
  res.json({
    status: result ? 'success' : 'error',
    message: result ? 'Automation service started' : 'Automation service is already running'
  });
});

// Stop the automation service
router.post('/stop', (req, res) => {
  const result = automationService.stop();
  res.json({
    status: result ? 'success' : 'error',
    message: result ? 'Automation service stopped' : 'Automation service is not running'
  });
});

// Get automation service status
router.get('/status', (req, res) => {
  res.json({
    status: 'success',
    isRunning: automationService.isRunning,
    lastRebalance: automationService.lastRebalance,
    rebalanceThreshold: automationService.rebalanceThreshold
  });
});

// Process an AI recommendation
router.post('/recommendation', async (req, res) => {
  try {
    const { recommendation, walletId, forceRebalance } = req.body;
    
    if (!recommendation || !walletId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: recommendation and walletId'
      });
    }
    
    const result = await automationService.processRecommendation(recommendation, {
      walletId,
      forceRebalance: !!forceRebalance
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error processing recommendation:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to process recommendation: ${error.message}`
    });
  }
});

// Configure automation service
router.post('/configure', (req, res) => {
  try {
    const { rebalanceThreshold } = req.body;
    
    if (typeof rebalanceThreshold === 'number' && rebalanceThreshold > 0 && rebalanceThreshold < 1) {
      automationService.rebalanceThreshold = rebalanceThreshold;
      
      res.json({
        status: 'success',
        message: 'Automation service configured',
        rebalanceThreshold: automationService.rebalanceThreshold
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid rebalance threshold. Must be a number between 0 and 1'
      });
    }
  } catch (error) {
    console.error('Error configuring automation service:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to configure automation service: ${error.message}`
    });
  }
});

module.exports = router;
