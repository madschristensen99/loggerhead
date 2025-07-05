const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrivyClient } = require('@privy-io/server-auth');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Log environment variables (without secrets)
console.log('Environment loaded:');
console.log('PRIVY_API_KEY:', process.env.PRIVY_API_KEY ? '✓ Set' : '✗ Not set');
console.log('PRIVY_APP_SECRET:', process.env.PRIVY_APP_SECRET ? '✓ Set' : '✗ Not set');

const app = express();
const port = process.env.PORT || 4000;

// Initialize Privy client with API key and app secret from environment variables
const privy = new PrivyClient(
  process.env.PRIVY_API_KEY,
  process.env.PRIVY_APP_SECRET
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API key middleware for internal authentication
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === 'loggerhead-internal-api-key') {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get all wallets endpoint
app.get('/api/wallets', apiKeyMiddleware, async (req, res) => {
  try {
    console.log('Getting all wallets...');
    
    // Method 1: Try using the SDK's getUsers method to get all users and extract wallets
    try {
      console.log('Attempting to get all users via SDK...');
      const users = await privy.getUsers();
      console.log(`Found ${users.length} users`);
      
      // Extract wallets from all users
      const allWallets = [];
      for (const user of users) {
        if (user.linkedAccounts) {
          const userWallets = user.linkedAccounts.filter(account => account.type === 'wallet');
          if (userWallets.length > 0) {
            console.log(`User ${user.id} has ${userWallets.length} wallets`);
            allWallets.push(...userWallets);
          }
        }
      }
      
      console.log(`Total wallets found: ${allWallets.length}`);
      console.log('Wallet details:', JSON.stringify(allWallets, null, 2));
      
      return res.status(200).json({
        success: true,
        wallets: allWallets,
        count: allWallets.length
      });
    } catch (sdkError) {
      console.error('Error using SDK method:', sdkError.message);
      console.log('Falling back to direct API call...');
      
      // Method 2: Direct API call as fallback
      const response = await axios({
        method: 'GET',
        url: 'https://auth.privy.io/api/v1/wallets',
        headers: {
          'Authorization': `Bearer ${process.env.PRIVY_APP_SECRET}`,
          'Content-Type': 'application/json',
          'X-Privy-App-Id': process.env.PRIVY_API_KEY
        }
      });
      
      console.log('API response:', JSON.stringify(response.data, null, 2));
      
      return res.status(200).json({
        success: true,
        wallets: response.data.wallets || [],
        nextCursor: response.data.next_cursor,
        count: (response.data.wallets || []).length
      });
    }
  } catch (error) {
    console.error('Error getting all wallets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get all wallets',
      details: error.message || 'Unknown error'
    });
  }
});

// Get wallets for a specific user
app.get('/api/wallets/:userId', apiKeyMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Get user data which includes linked accounts (wallets)
    const user = await privy.getUser(userId);
    const wallets = user.linkedAccounts.filter(account => account.type === 'wallet');
    
    res.status(200).json({
      success: true,
      wallets: wallets
    });
  } catch (error) {
    console.error(`Error getting wallets for user ${req.params.userId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user wallets',
      details: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Wallet server running on port ${port}`);
});

module.exports = app;
