/**
 * Automation Service
 * 
 * Handles automated trading based on AI recommendations
 * Manages wallet rebalancing between EURC on Aave (Base) and strUSDC on Flow
 */
const walletService = require('./walletService');
const tradeService = require('./tradeService');
const config = require('../config/config');
const { ethers } = require('ethers');

class AutomationService {
  constructor() {
    this.isRunning = false;
    this.lastRebalance = null;
    this.rebalanceThreshold = config.aiAgent.rebalanceThreshold || 0.05; // 5% threshold for rebalancing
    this.walletCache = new Map(); // Cache wallet details to avoid repeated API calls
  }

  /**
   * Start the automation service
   * @returns {boolean} - Whether the service was started successfully
   */
  start() {
    if (this.isRunning) {
      console.log('Automation service is already running');
      return false;
    }

    console.log('Starting automation service...');
    this.isRunning = true;
    return true;
  }

  /**
   * Stop the automation service
   * @returns {boolean} - Whether the service was stopped successfully
   */
  stop() {
    if (!this.isRunning) {
      console.log('Automation service is not running');
      return false;
    }

    console.log('Stopping automation service...');
    this.isRunning = false;
    return true;
  }

  /**
   * Process an AI recommendation and execute trades if necessary
   * @param {Object} recommendation - The AI recommendation {EURC: number, USDC: number}
   * @param {Object} options - Options for processing the recommendation
   * @param {string} options.walletId - The wallet ID to use for trading
   * @param {boolean} options.forceRebalance - Whether to force a rebalance regardless of threshold
   * @returns {Promise<Object>} - The result of processing the recommendation
   */
  async processRecommendation(recommendation, options = {}) {
    if (!this.isRunning) {
      return {
        status: 'error',
        message: 'Automation service is not running'
      };
    }

    try {
      const { walletId, forceRebalance = false } = options;
      
      if (!walletId) {
        throw new Error('Wallet ID is required');
      }

      // Validate recommendation format
      if (!recommendation || typeof recommendation.EURC !== 'number' || typeof recommendation.USDC !== 'number') {
        throw new Error('Invalid recommendation format. Expected {EURC: number, USDC: number}');
      }

      // Get wallet details
      const wallet = await this._getWallet(walletId);
      
      // Calculate current allocation
      const currentAllocation = await this._getCurrentAllocation(wallet);
      
      // Determine if rebalance is needed
      const needsRebalance = this._needsRebalance(currentAllocation, recommendation, forceRebalance);
      
      if (!needsRebalance) {
        return {
          status: 'success',
          message: 'No rebalancing needed',
          currentAllocation,
          targetAllocation: recommendation
        };
      }
      
      // Calculate trade actions
      const tradeActions = this._calculateTradeActions(currentAllocation, recommendation);
      
      // Execute trades
      const tradeResults = [];
      for (const action of tradeActions) {
        console.log(`Executing trade: ${action.from} -> ${action.to}, amount: ${action.amount}`);
        const result = await this._executeTrade(wallet, action);
        tradeResults.push(result);
      }
      
      // Update last rebalance timestamp
      this.lastRebalance = new Date();
      
      return {
        status: 'success',
        message: 'Rebalancing completed',
        currentAllocation,
        targetAllocation: recommendation,
        actions: tradeActions,
        results: tradeResults
      };
    } catch (error) {
      console.error('Error processing recommendation:', error);
      return {
        status: 'error',
        message: `Failed to process recommendation: ${error.message}`
      };
    }
  }

  /**
   * Get wallet details
   * @param {string} walletId - The wallet ID
   * @returns {Promise<Object>} - The wallet details
   * @private
   */
  async _getWallet(walletId) {
    console.log(`AutomationService._getWallet: Fetching wallet details for ID: ${walletId}`);
    
    // Check cache first
    if (this.walletCache.has(walletId)) {
      console.log('AutomationService._getWallet: Using cached wallet details');
      return this.walletCache.get(walletId);
    }
    
    try {
      console.log('AutomationService._getWallet: Calling walletService.getWalletDetails');
      
      // Get wallet details from Privy
      const wallet = await walletService.getWalletDetails(walletId);
      
      console.log('AutomationService._getWallet: Wallet details fetched successfully:', JSON.stringify(wallet, null, 2));
      
      // Add private key for signing transactions (this would normally come from a secure key management system)
      // For testing, we're using a dummy private key
      wallet.privateKey = '0x0000000000000000000000000000000000000000000000000000000000000001';
      
      // Cache wallet details
      this.walletCache.set(walletId, wallet);
      
      return wallet;
    } catch (error) {
      console.error('AutomationService._getWallet: Error getting wallet details:', error);
      throw new Error(`Failed to get wallet details: ${error.message}`);
    }
  }

  /**
   * Calculate current allocation of assets
   * @param {Object} wallet - The wallet details
   * @returns {Promise<Object>} - The current allocation
   * @private
   */
  async _getCurrentAllocation(wallet) {
    try {
      // Get EURC balance on Base
      const eurcBalance = await tradeService.getTokenBalance(
        wallet.address,
        config.tokens.base.EURC,
        'base'
      );
      
      // Get strUSDC balance on Flow
      const strUsdcBalance = await tradeService.getTokenBalance(
        wallet.address,
        config.tokens.flow.strUSDC,
        'flow'
      );
      
      // Calculate total value (assuming 1:1 exchange rate for simplicity)
      const totalValue = eurcBalance.add(strUsdcBalance);
      
      if (totalValue.isZero()) {
        return { EURC: 0, USDC: 0 };
      }
      
      // Calculate allocation percentages
      const eurcAllocation = eurcBalance.mul(100).div(totalValue).toNumber() / 100;
      const usdcAllocation = strUsdcBalance.mul(100).div(totalValue).toNumber() / 100;
      
      return {
        EURC: eurcAllocation,
        USDC: usdcAllocation
      };
    } catch (error) {
      console.error('Error calculating current allocation:', error);
      throw new Error(`Failed to calculate current allocation: ${error.message}`);
    }
  }

  /**
   * Determine if rebalancing is needed
   * @param {Object} currentAllocation - The current allocation
   * @param {Object} targetAllocation - The target allocation
   * @param {boolean} forceRebalance - Whether to force a rebalance
   * @returns {boolean} - Whether rebalancing is needed
   * @private
   */
  _needsRebalance(currentAllocation, targetAllocation, forceRebalance = false) {
    if (forceRebalance) {
      return true;
    }
    
    // Calculate difference between current and target
    const eurcDiff = Math.abs(targetAllocation.EURC - currentAllocation.EURC);
    
    // Check if difference exceeds threshold
    return eurcDiff > this.rebalanceThreshold;
  }

  /**
   * Calculate trade actions based on current and target allocations
   * @param {Object} currentAllocation - The current allocation
   * @param {Object} targetAllocation - The target allocation
   * @returns {Array} - The trade actions to execute
   * @private
   */
  _calculateTradeActions(currentAllocation, targetAllocation) {
    const actions = [];
    
    // Calculate difference between current and target
    const eurcDiff = targetAllocation.EURC - currentAllocation.EURC;
    
    if (Math.abs(eurcDiff) > this.rebalanceThreshold) {
      if (eurcDiff > 0) {
        // Need to increase EURC allocation (convert USDC to EURC)
        actions.push({
          from: 'USDC',
          to: 'EURC',
          amount: eurcDiff,
          sourceChain: 'flow',
          destinationChain: 'base'
        });
      } else {
        // Need to decrease EURC allocation (convert EURC to USDC)
        actions.push({
          from: 'EURC',
          to: 'USDC',
          amount: Math.abs(eurcDiff),
          sourceChain: 'base',
          destinationChain: 'flow'
        });
      }
    }
    
    return actions;
  }

  /**
   * Execute a trade
   * @param {Object} wallet - The wallet details
   * @param {Object} action - The trade action
   * @returns {Promise<Object>} - The trade result
   * @private
   */
  async _executeTrade(wallet, action) {
    try {
      // Determine source and destination tokens and chains
      const srcToken = action.from === 'EURC' ? config.tokens.base.EURC : config.tokens.flow.strUSDC;
      const dstToken = action.to === 'EURC' ? config.tokens.base.EURC : config.tokens.flow.strUSDC;
      const srcChainKey = action.sourceChain;
      const dstChainKey = action.destinationChain;
      
      // Calculate amount to transfer based on percentage
      const balance = await tradeService.getTokenBalance(
        wallet.address,
        srcToken,
        srcChainKey
      );
      
      // Calculate amount to transfer (action.amount is a percentage)
      const transferAmount = balance.mul(ethers.BigNumber.from(Math.floor(action.amount * 100))).div(100);
      
      if (transferAmount.isZero()) {
        return {
          status: 'error',
          message: 'Transfer amount is zero'
        };
      }
      
      // Get quotes for the transfer
      const quotes = await tradeService.getQuotes({
        srcToken,
        dstToken,
        srcChainKey,
        dstChainKey,
        srcAddress: wallet.address,
        dstAddress: wallet.address,
        srcAmount: transferAmount.toString()
      });
      
      // Execute the transfer
      const result = await tradeService.executeTransfer(wallet.id, quotes.quoteId, wallet.privateKey);
      
      return {
        status: 'success',
        action,
        transferAmount: transferAmount.toString(),
        result
      };
    } catch (error) {
      console.error('Error executing trade:', error);
      return {
        status: 'error',
        message: `Failed to execute trade: ${error.message}`,
        action
      };
    }
  }
}

module.exports = new AutomationService();
