# Loggerhead: Euro-Dollar Yield Optimization Platform

Loggerhead is an advanced financial platform designed to optimize yields between Euro (EURC) and US Dollar (USDC) stablecoin investments across different blockchain networks. The system leverages AI-driven market analysis to determine optimal asset allocation and automates cross-chain transfers to maximize returns.

## 🌟 Project Overview

Loggerhead combines AI-powered market analysis with DeFi automation to:

1. **Analyze Market Conditions**: Uses Perplexity API to analyze real-time financial data from trusted sources to determine optimal EUR vs USD allocation
2. **Manage Digital Wallets**: Creates and manages wallets using Privy's API
3. **Execute Cross-Chain Transfers**: Performs automated transfers between EURC on Aave (Base network) and strUSDC on Flow using Stargate Finance
4. **Optimize Yield**: Continuously rebalances portfolios based on market conditions and yield opportunities

## 🏗️ Project Structure

```
loggerhead/
├── backend/
│   ├── defi/                 # DeFi integration services
│   │   └── src/
│   │       ├── services/     # Core services for trading and wallet management
│   │       └── routes/       # API endpoints for DeFi operations
│   ├── mcp/                  # Model Context Protocol AI agent
│   │   └── currency-advisor.js  # AI agent for EUR/USD analysis
│   ├── routes/               # Main API routes
│   ├── mcp-server.js         # MCP server implementation
│   └── app.js               # Main backend application
│
└── frontend/                # Next.js frontend application
    ├── app/                 # Application pages and components
    └── public/              # Static assets
```

## 🧠 AI Agent for Portfolio Allocation

The system uses an AI agent built with the Model Context Protocol (MCP) to determine optimal portfolio allocation:

- **Real-time Web Analysis**: Leverages Perplexity API to gather and analyze current market data from trusted financial sources
- **Multi-factor Analysis**: Considers exchange rates, economic indicators, central bank policies, market sentiment, and geopolitical factors
- **Probability-based Output**: Returns precise investment allocation percentages for EUR and USD
- **Adaptive Decision-making**: Continuously updates recommendations based on changing market conditions

The AI agent analyzes data from sources like Bloomberg, Reuters, Financial Times, and central bank websites to provide evidence-based allocation recommendations.

## 💱 DeFi Integration

The DeFi component handles the execution of the AI agent's recommendations:

- **Wallet Management**: Creates and manages wallets using Privy's API
- **Cross-chain Transfers**: Executes transfers between EURC on Base network and strUSDC on Flow using Stargate Finance
- **Automated Rebalancing**: Automatically rebalances portfolios when market conditions change significantly
- **Yield Optimization**: Monitors and compares yields across different networks to maximize returns

## 🌐 Backend Services

Key backend services include:

- **TradeService**: Handles cross-chain transfers and trading operations
- **WalletService**: Manages wallet creation and authentication
- **AutomationService**: Orchestrates automated portfolio rebalancing
- **CurrencyAdvisorMCP**: AI agent that determines optimal EUR/USD allocation

## 🖥️ Frontend Application

The frontend is built with Next.js and provides:

- Portfolio dashboard with current allocation and performance metrics
- Visualization of AI recommendations and market analysis
- Manual override controls for portfolio management
- Transaction history and yield performance tracking

## 🚀 Getting Started

### Backend Setup

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   ```
   
3. Update the `.env` file with your API keys (Privy, Perplexity, etc.)

4. Start the backend server:
   ```
   npm start
   ```

### DeFi Component Setup

1. Install dependencies:
   ```
   cd backend/defi
   npm install
   ```

2. Start the DeFi services:
   ```
   npm start
   ```

### Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📊 API Endpoints

### Currency Analysis

- `GET /currency` - Get AI-recommended EUR/USD allocation with reasoning

### Wallet Management

- `POST /api/wallets` - Create a new wallet
- `GET /api/wallets/:userId` - Get user wallets
- `GET /api/wallets/:walletId/balance` - Get wallet balance

### Trading

- `POST /api/trades/allocate` - Process AI allocation recommendations and execute trades
- `GET /api/trades/quotes` - Get quotes for cross-chain transfers
- `POST /api/trades/execute` - Execute a cross-chain transfer
- `GET /api/trades/status/:transactionId` - Check status of a cross-chain transfer

## 🔒 Security Notes

- Never commit your `.env` file with real API keys or private keys
- Implement proper authentication and authorization before deploying to production
- Consider using a secure key management service for production deployments

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
