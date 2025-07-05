# Portfolio Simulator with Claude AI Orchestrator

This document describes the integration of the Claude AI Orchestrator into the DeFi portfolio simulator for intelligent portfolio recommendations.

## Overview

The portfolio simulator now uses the Claude AI Orchestrator to generate real-time portfolio recommendations based on:
- Current market conditions from Perplexity MCP
- AI analysis from ChatGPT MCP
- Multi-source data synthesis
- Risk assessment and confidence scoring

## Features

### 🤖 AI-Powered Recommendations
- **Real-time Analysis**: Uses Claude AI to analyze current market conditions
- **Multi-Source Data**: Combines Perplexity and ChatGPT insights
- **Confidence Scoring**: Each recommendation includes a confidence level (1-10)
- **Risk Assessment**: Detailed risk analysis for each recommendation
- **Alternative Scenarios**: Multiple possible outcomes and strategies

### 🔄 Fallback Mechanism
- **Graceful Degradation**: Falls back to conservative allocation if AI services are unavailable
- **Service Health Monitoring**: Continuously monitors MCP server health
- **Error Handling**: Robust error handling with detailed logging

### 📊 Enhanced Output
- **Comprehensive Analysis**: Includes AI system status and MCP server health
- **Detailed Reasoning**: Explains the rationale behind each recommendation
- **Time Horizon**: Specifies short-term vs long-term considerations
- **Source Attribution**: Tracks which AI services contributed to the analysis

## API Integration

### Main Backend Connection
The portfolio simulator connects to the main backend's Claude AI Orchestrator at:
```
GET /ai-currency
GET /ai-currency/health
```

### Environment Variables
```bash
BACKEND_API_URL=http://localhost:3000  # Main backend URL
```

## Usage

### Basic Portfolio Recommendation
```javascript
const portfolioSimulator = require('./portfolioSimulator');

const walletData = {
  address: '0x...',
  usdcBalance: '1000000000',
  usdcBalanceFormatted: '1000.0'
};

const recommendation = await portfolioSimulator.generatePortfolioRecommendation(walletData);
```

### Comprehensive Analysis
```javascript
const comprehensive = await portfolioSimulator.generateComprehensiveRecommendation(walletData);
// Includes AI system status and MCP server health
```

### Detailed AI Analysis
```javascript
const aiAnalysis = await portfolioSimulator.getDetailedAIAnalysis(walletData);
// Returns AI system status and MCP server information
```

## Output Format

### Portfolio Recommendation
```javascript
{
  walletAddress: '0x...',
  currentBalance: { USDC: 1000.0 },
  recommendedPortfolio: {
    EUR: 0.45,  // 45%
    USD: 0.55   // 55%
  },
  recommendedAmounts: {
    EUR: 450.0,
    USD: 550.0
  },
  reasoning: "AI-generated analysis...",
  confidenceLevel: 8,
  riskAssessment: "Moderate risk with upside potential",
  alternativeScenarios: ["Scenario 1", "Scenario 2"],
  timeHorizon: "Short-term: Conservative, Long-term: Growth",
  source: "Claude AI Orchestrator",
  fallback: false,
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

### Comprehensive Recommendation
```javascript
{
  // ... all portfolio recommendation fields ...
  aiAnalysis: {
    aiStatus: "healthy",
    mcpServers: {
      "perplexity": true,
      "chatgpt": true
    },
    lastAnalysis: { /* full AI response */ },
    timestamp: "2024-01-01T00:00:00.000Z"
  },
  comprehensive: true
}
```

## Testing

Run the test suite to verify the integration:

```bash
npm run test:portfolio
```

The test suite covers:
- Basic portfolio recommendation generation
- Comprehensive analysis retrieval
- AI system health monitoring
- Fallback mechanism testing

## Error Handling

### AI Service Unavailable
When the Claude AI Orchestrator is unavailable, the system falls back to a conservative allocation:
- **EUR**: 40%
- **USD**: 60%
- **Reasoning**: Conservative allocation for stability
- **Confidence**: 5/10 (lower due to fallback)

### Network Errors
- Timeout handling (30 seconds)
- Retry logic for transient failures
- Detailed error logging with emojis for easy identification

## Monitoring

### Health Checks
The system continuously monitors:
- Claude AI Orchestrator availability
- MCP server health (Perplexity, ChatGPT)
- Response times and quality

### Logging
Enhanced logging with emojis for easy identification:
- 🤖 AI queries
- 📊 AI responses
- ⚠️ Warnings
- ❌ Errors
- 🔄 Fallbacks
- ✅ Success

## Dependencies

### New Dependencies
- `@anthropic-ai/sdk`: For Claude AI integration
- `axios`: For HTTP requests to the main backend

### Updated Dependencies
All existing dependencies remain unchanged.

## Migration from Old Simulator

The old portfolio simulator returned fixed allocations (50% EUR, 50% USD). The new system:

1. **Maintains API Compatibility**: All existing function signatures remain the same
2. **Enhances Output**: Adds AI metadata while preserving core functionality
3. **Improves Reliability**: Adds fallback mechanisms and error handling
4. **Provides Transparency**: Shows AI reasoning and confidence levels

## Future Enhancements

### Planned Features
- **Historical Analysis**: Track recommendation accuracy over time
- **Custom Risk Profiles**: User-defined risk tolerance levels
- **Portfolio Backtesting**: Test recommendations against historical data
- **Real-time Alerts**: Notify when significant allocation changes are recommended

### MCP Server Expansion
- **Market Data MCP**: Real-time price feeds and market indicators
- **Economic Indicators MCP**: GDP, inflation, interest rates
- **Sentiment Analysis MCP**: Social media and news sentiment
- **Central Bank Communications MCP**: Policy announcements and guidance

## Troubleshooting

### Common Issues

1. **AI Service Unavailable**
   - Check main backend is running
   - Verify environment variables
   - Check network connectivity

2. **Invalid Allocations**
   - System automatically normalizes percentages
   - Check logs for normalization warnings

3. **Slow Response Times**
   - AI analysis can take 10-30 seconds
   - Consider caching for frequent requests

### Debug Mode
Enable detailed logging by setting:
```bash
DEBUG=portfolio-simulator
```

## Support

For issues with the Claude AI Orchestrator integration:
1. Check the main backend logs
2. Verify MCP server health
3. Review the test suite output
4. Check environment configuration 