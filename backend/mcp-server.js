const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const CurrencyAdvisorMCP = require('./mcp/currency-advisor');

class CurrencyAdvisorMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'currency-advisor-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.currencyAdvisor = new CurrencyAdvisorMCP();
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'analyze_currency_investment':
          return await this.handleCurrencyAnalysis(args);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async handleCurrencyAnalysis(args) {
    try {
      console.log('🔄 MCP Server: Starting currency analysis...');
      
      const result = await this.currencyAdvisor.execute();
      
      console.log('✅ MCP Server: Analysis complete:', result);
      
      return {
        content: [
          {
            type: 'text',
            text: `Currency Investment Analysis Complete\n\nEUR: ${result.EUR}\nUSD: ${result.USD}\n\nThis analysis is based on real-time web data from Perplexity API, considering current market conditions, economic indicators, central bank policies, and market sentiment.`
          }
        ]
      };
      
    } catch (error) {
      console.error('❌ MCP Server: Error in currency analysis:', error);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}\n\nPlease ensure PERPLEXITY_API_KEY is set in your environment variables.`
          }
        ],
        isError: true
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🚀 Currency Advisor MCP Server started');
  }
}

// Tool definitions for the MCP server
const tools = [
  {
    name: 'analyze_currency_investment',
    description: 'Analyzes real-time web data using Perplexity API to determine optimal EUR vs USD investment allocation',
    inputSchema: {
      type: 'object',
      properties: {
        includeReasoning: {
          type: 'boolean',
          description: 'Whether to include detailed reasoning in the response',
          default: false
        }
      }
    }
  }
];

// Export for use in the main application
module.exports = { CurrencyAdvisorMCPServer, tools };

// Run the server if this file is executed directly
if (require.main === module) {
  const server = new CurrencyAdvisorMCPServer();
  server.run().catch(console.error);
} 