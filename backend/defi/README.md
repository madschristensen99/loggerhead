# Loggerhead

A server-side application that integrates Privy wallets with Stargate Finance for cross-chain transfers based on AI agent allocation recommendations.

## Overview

Loggerhead is designed to:
1. Create and manage wallets using Privy's API
2. Execute cross-chain transfers between EURC on Aave (Base) and strUSDC on Flow using Stargate Finance
3. Process allocation recommendations from an AI agent (e.g., `{EURC: 0.7, USDC: 0.3}`)

## Project Structure

```
loggerhead/
├── src/
│   ├── config/         # Configuration files
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic services
│   ├── .env.example    # Example environment variables
│   └── index.js        # Main application entry point
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   cp src/.env.example .env
   ```
4. Update the `.env` file with your Privy API key and other required values
5. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Wallet Management

- `POST /api/wallets` - Create a new wallet
- `GET /api/wallets/:userId` - Get user wallets
- `GET /api/wallets/:walletId/balance` - Get wallet balance

### Trading

- `POST /api/trades/allocate` - Process AI allocation recommendations and execute trades
- `GET /api/trades/quotes` - Get quotes for cross-chain transfers
- `POST /api/trades/execute` - Execute a cross-chain transfer
- `GET /api/trades/status/:transactionId` - Check status of a cross-chain transfer

## Example Usage

### Processing AI Allocation Recommendations

```javascript
// Example request to process AI allocation
const response = await fetch('http://localhost:3000/api/trades/allocate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    walletId: 'wallet_123456',
    allocation: {
      EURC: 0.7,
      USDC: 0.3
    }
  })
});

const result = await response.json();
console.log(result);
```

## Dependencies

- Express - Web server framework
- Axios - HTTP client for API requests
- Ethers - Ethereum library for blockchain interactions
- dotenv - Environment variable management

## Security Notes

- Never commit your `.env` file with real API keys or private keys
- Implement proper authentication and authorization before deploying to production
- Consider using a secure key management service for production deployments
