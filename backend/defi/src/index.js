const express = require('express');
const dotenv = require('dotenv');
const { ethers } = require('ethers');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
app.use(express.json());

// Default port
const PORT = process.env.PORT || 3000;

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'Loggerhead API is running' });
});

// API routes
app.use('/api/wallets', require('./routes/wallets'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/mock', require('./routes/mockDecision'));
app.use('/api/automation', require('./routes/automation'));

// API documentation route
app.get('/api-docs', (req, res) => {
  res.json({
    name: 'Loggerhead API',
    description: 'Server-side application for automated trading based on AI recommendations',
    version: '1.0.0',
    endpoints: [
      {
        path: '/api/automation/recommendation',
        method: 'POST',
        description: 'Process an AI recommendation and execute trades if necessary',
        body: {
          recommendation: { EURC: 0.7, USDC: 0.3 },
          walletId: 'wallet_id_from_privy',
          forceRebalance: false
        }
      },
      {
        path: '/api/automation/start',
        method: 'POST',
        description: 'Start the automation service'
      },
      {
        path: '/api/automation/stop',
        method: 'POST',
        description: 'Stop the automation service'
      },
      {
        path: '/api/automation/status',
        method: 'GET',
        description: 'Get the current status of the automation service'
      },
      {
        path: '/api/wallets',
        method: 'GET',
        description: 'Wallet management endpoints'
      },
      {
        path: '/api/trades',
        method: 'GET',
        description: 'Trade execution endpoints'
      },
      {
        path: '/api/mock',
        method: 'GET',
        description: 'Mock decision generation endpoints for testing'
      }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message
  });
});

module.exports = app;
