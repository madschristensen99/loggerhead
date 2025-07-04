const axios = require('axios');
const { ethers } = require('ethers');
const walletService = require('./walletService');

// Stargate API base URL
const STARGATE_API_BASE_URL = 'https://stargate.finance/api/v1';

// Token addresses and chain configurations
const TOKENS = {
  // Base network
  BASE: {
    EURC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // EURC on Base
    chainKey: 'base'
  },
  // Flow network
  FLOW: {
    strUSDC: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // strUSDC on Flow
    chainKey: 'flow'
  }
};

/**
 * Service to handle trading operations using Stargate Finance API
 */
class TradeService {
  constructor() {
    // Initialize providers for different chains
    this.providers = {
      base: new ethers.providers.JsonRpcProvider(process.env.BASE_RPC_URL),
      flow: new ethers.providers.JsonRpcProvider(process.env.FLOW_RPC_URL)
    };
  }

  /**
   * Process AI allocation recommendations and execute trades
   * @param {string} walletId - The wallet ID to use for trading
   * @param {Object} allocation - The allocation recommendations from AI (e.g., {EURC: 0.7, USDC: 0.3})
   * @returns {Promise<Object>} - The trade execution results
   */
  async processAllocation(walletId, allocation) {
    try {
      // Get wallet details from Privy
      const wallet = await this._getWalletDetails(walletId);
      
      // Calculate the current allocation
      const currentAllocation = await this._getCurrentAllocation(wallet);
      
      // Determine if we need to rebalance
      const tradeActions = this._calculateTradeActions(currentAllocation, allocation);
      
      // Execute trades if needed
      if (tradeActions.length === 0) {
        return { 
          message: 'No rebalancing needed',
          currentAllocation
        };
      }
      
      const results = [];
      for (const action of tradeActions) {
        const result = await this._executeTrade(wallet, action);
        results.push(result);
      }
      
      return {
        message: 'Rebalancing completed',
        actions: tradeActions,
        results
      };
    } catch (error) {
      console.error('Error processing allocation:', error);
      throw new Error(`Failed to process allocation: ${error.message}`);
    }
  }

  /**
   * Get quotes for cross-chain transfers
   * @param {Object} params - Quote parameters
   * @returns {Promise<Object>} - The quotes data
   */
  async getQuotes(params) {
    try {
      const response = await axios.get(`${STARGATE_API_BASE_URL}/quotes`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting quotes:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get quotes');
    }
  }

  /**
   * Execute a cross-chain transfer
   * @param {string} walletId - The wallet ID
   * @param {string} quoteId - The quote ID from getQuotes
   * @param {string} privateKey - The private key for signing transactions
   * @returns {Promise<Object>} - The transfer execution result
   */
  async executeTransfer(walletId, quoteId, privateKey) {
    try {
      // Get the quote details
      const quoteResponse = await axios.get(`${STARGATE_API_BASE_URL}/quotes/${quoteId}`);
      const quote = quoteResponse.data;
      
      // Get wallet details
      const wallet = await this._getWalletDetails(walletId);
      
      // Create and sign transactions
      const results = [];
      for (const txData of quote.transactions) {
        const chainKey = txData.chainKey;
        const provider = this.providers[chainKey];
        
        // Create wallet with private key
        const signer = new ethers.Wallet(privateKey, provider);
        
        // Create transaction
        const tx = {
          to: txData.to,
          data: txData.data,
          value: ethers.utils.parseEther(txData.value || '0'),
          gasPrice: provider.getGasPrice(),
          gasLimit: ethers.utils.hexlify(3000000) // Safe gas limit
        };
        
        // Sign and send transaction
        const signedTx = await signer.sendTransaction(tx);
        const receipt = await signedTx.wait();
        
        results.push({
          chainKey,
          txHash: receipt.transactionHash,
          status: receipt.status === 1 ? 'success' : 'failed'
        });
      }
      
      return {
        quoteId,
        transactions: results
      };
    } catch (error) {
      console.error('Error executing transfer:', error);
      throw new Error(`Failed to execute transfer: ${error.message}`);
    }
  }

  /**
   * Check status of a cross-chain transfer
   * @param {string} transactionId - The transaction ID
   * @returns {Promise<Object>} - The transaction status
   */
  async checkTransferStatus(transactionId) {
    try {
      const response = await axios.get(`${STARGATE_API_BASE_URL}/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking transfer status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to check transfer status');
    }
  }

  /**
   * Get wallet details from Privy
   * @param {string} walletId - The wallet ID
   * @returns {Promise<Object>} - The wallet details
   * @private
   */
  async _getWalletDetails(walletId) {
    // This would typically call the Privy API to get wallet details
    // For now, we'll mock this with a simple implementation
    return {
      id: walletId,
      address: '0x1234567890abcdef1234567890abcdef12345678', // Mock address
      chainType: 'evm'
    };
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
      const eurcBalance = await this._getTokenBalance(
        wallet.address,
        TOKENS.BASE.EURC,
        'base'
      );
      
      // Get strUSDC balance on Flow
      const strUsdcBalance = await this._getTokenBalance(
        wallet.address,
        TOKENS.FLOW.strUSDC,
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
   * Public method to get token balance
   * @param {string} address - The wallet address
   * @param {string} tokenAddress - The token address
   * @param {string} chainKey - The chain key
   * @returns {Promise<BigNumber>} - The token balance
   */
  async getTokenBalance(address, tokenAddress, chainKey) {
    return this._getTokenBalance(address, tokenAddress, chainKey);
  }

  /**
   * Get token balance
   * @param {string} address - The wallet address
   * @param {string} tokenAddress - The token address
   * @param {string} chainKey - The chain key
   * @returns {Promise<BigNumber>} - The token balance
   * @private
   */
  async _getTokenBalance(address, tokenAddress, chainKey) {
    try {
      const provider = this.providers[chainKey];
      const tokenAbi = ['function balanceOf(address) view returns (uint256)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      return await tokenContract.balanceOf(address);
    } catch (error) {
      console.error(`Error getting ${tokenAddress} balance on ${chainKey}:`, error);
      return ethers.BigNumber.from(0);
    }
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
    const usdcDiff = targetAllocation.USDC - currentAllocation.USDC;
    
    // Define threshold for rebalancing (e.g., 5%)
    const threshold = 0.05;
    
    if (Math.abs(eurcDiff) > threshold) {
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
      const srcToken = action.from === 'EURC' ? TOKENS.BASE.EURC : TOKENS.FLOW.strUSDC;
      const dstToken = action.to === 'EURC' ? TOKENS.BASE.EURC : TOKENS.FLOW.strUSDC;
      const srcChainKey = action.sourceChain;
      const dstChainKey = action.destinationChain;
      
      // Get quotes for the transfer
      const quotes = await this.getQuotes({
        srcToken,
        dstToken,
        srcChainKey,
        dstChainKey,
        srcAddress: wallet.address,
        dstAddress: wallet.address,
        srcAmount: action.amount.toString() // This would need proper conversion based on token decimals
      });
      
      // For now, we'll just return the quotes as we don't have the private key to execute
      return {
        action,
        quotes
      };
    } catch (error) {
      console.error('Error executing trade:', error);
      throw new Error(`Failed to execute trade: ${error.message}`);
    }
  }
}

module.exports = new TradeService();
