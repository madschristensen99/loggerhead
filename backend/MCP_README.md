# Currency Advisor MCP Server

A Model Context Protocol (MCP) server that uses Perplexity API to analyze real-time web data and provide EUR vs USD investment recommendations.

## Features

- 🌐 **Real-time Web Analysis**: Uses Perplexity's Sonar API to gather current market data
- 📊 **Intelligent Investment Recommendations**: Analyzes multiple factors including:
  - Current exchange rates and trends
  - Economic indicators (inflation, interest rates, GDP growth)
  - Central bank policies (ECB vs Federal Reserve)
  - Market sentiment and technical analysis
  - Geopolitical factors
- 🎯 **Probability-based Output**: Returns investment allocation percentages for EUR and USD
- 🔄 **MCP Integration**: Compatible with Claude Desktop, Cursor, and other MCP-enabled applications

## Setup

### 1. Get Perplexity API Key

1. Sign up for a Perplexity API account at [perplexity.ai](https://perplexity.ai)
2. Generate your API key from the developer dashboard
3. Set the API key as an environment variable:
   ```bash
   export PERPLEXITY_API_KEY="your_api_key_here"
   ```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Test the MCP

```bash
# Test the currency advisor directly
npm run test-mcp

# Start the MCP server
npm run mcp
```

## Usage

### As a Web API

```bash
# Start the Express server
npm start

# Query the currency endpoint
curl http://localhost:3000/currency
```

Response:
```json
{
  "EUR": "65%",
  "USD": "35%",
  "reasoning": "Based on current analysis of market conditions, the EUR shows strength due to recent ECB policy decisions and lower inflation compared to the US. The USD remains attractive due to higher interest rates, but the EUR's stability in the current economic environment suggests a 65% allocation to EUR and 35% to USD for optimal risk-adjusted returns..."
}
```

### As an MCP Server

The MCP server can be integrated with Claude Desktop, Cursor, or other MCP-compatible applications.

#### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "currency-advisor": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "env": {
        "PERPLEXITY_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

#### Cursor Configuration

1. Open Cursor Settings
2. Navigate to MCP settings
3. Add new global MCP server with the configuration above

## How It Works

1. **Web Query**: The MCP queries Perplexity API with a specialized prompt for currency analysis
2. **Data Analysis**: Perplexity searches the web for current market data and provides analysis
3. **Response Parsing**: The MCP parses the response to extract investment percentages
4. **Fallback Analysis**: If parsing fails, it performs sentiment analysis on the response text
5. **Result Formatting**: Returns probabilities in the specified JSON format

## API Endpoints

### GET /currency

Returns investment recommendation probabilities with detailed reasoning.

**Response:**
```json
{
  "EUR": "65%",
  "USD": "35%"
}
```

## Environment Variables

- `PERPLEXITY_API_KEY`: Your Perplexity API key (required)

## Error Handling

The MCP includes comprehensive error handling:
- API key validation
- Network timeout handling
- Response parsing fallbacks
- Graceful degradation to neutral probabilities (50/50) if analysis fails

## Development

### Project Structure

```
backend/
├── mcp/
│   └── currency-advisor.js    # Main MCP implementation
├── mcp-server.js              # MCP server wrapper
├── mcp-config.json            # MCP configuration
├── routes/
│   └── currency.js            # Express route using MCP
└── package.json               # Dependencies and scripts
```

### Adding New Analysis Factors

To add new analysis factors, modify the `queryPerplexity()` method in `currency-advisor.js`:

```javascript
const messages = [
  {
    role: "system",
    content: `You are a financial analyst... Consider factors like:
    - Current exchange rates and trends
    - Economic indicators
    - Central bank policies
    - Market sentiment
    - Geopolitical factors
    - [ADD YOUR NEW FACTOR HERE]`
  }
];
```

## Troubleshooting

### Common Issues

1. **"PERPLEXITY_API_KEY environment variable is required"**
   - Ensure you've set the environment variable correctly
   - Check that the API key is valid

2. **"Failed to query Perplexity"**
   - Check your internet connection
   - Verify your API key has sufficient credits
   - Check Perplexity API status

3. **MCP Server not starting**
   - Ensure all dependencies are installed
   - Check that Node.js version is compatible
   - Verify the MCP SDK is properly installed

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG=currency-advisor:*
```

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues related to:
- **Perplexity API**: Contact Perplexity support
- **MCP Protocol**: Check the [MCP documentation](https://modelcontextprotocol.io/)
- **This Implementation**: Open an issue in this repository 