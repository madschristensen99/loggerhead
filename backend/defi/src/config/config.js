/**
 * Configuration settings for the application
 */
module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // Privy API configuration
  privy: {
    apiKey: process.env.PRIVY_API_KEY,
    apiUrl: 'https://api.privy.io/v1'
  },
  
  // Stargate Finance API configuration
  stargate: {
    apiUrl: 'https://stargate.finance/api/v1'
  },
  
  // Chain RPC URLs
  rpc: {
    base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    flow: process.env.FLOW_RPC_URL || 'https://rest-mainnet.onflow.org'
  },
  
  // Token configurations
  tokens: {
    base: {
      EURC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // EURC on Base
    },
    flow: {
      strUSDC: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' // strUSDC on Flow
    }
  },
  
  // AI agent configuration
  aiAgent: {
    // Configuration for the AI agent that provides allocation recommendations
    rebalanceThreshold: 0.05 // 5% threshold for rebalancing
  }
};
