const axios = require('axios');
const { Anthropic } = require('@anthropic-ai/sdk');
const CurrencyAdvisorMCP = require('./mcp/currency-advisor');
const ChatGPTAdvisorMCP = require('./mcp/chatgpt-advisor');

class ClaudeOrchestrator {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    this.mcpServers = {
      perplexity: {
        name: 'perplexity',
        description: 'Real-time web search and analysis using existing CurrencyAdvisorMCP',
        instance: new CurrencyAdvisorMCP()
      },
      chatgpt: {
        name: 'chatgpt',
        description: 'AI-powered currency analysis using OpenAI ChatGPT',
        instance: new ChatGPTAdvisorMCP()
      }
    };
    
    this.systemPrompt = `You are an intelligent financial analyst and decision-making assistant. Your role is to:

1. **Analyze complex financial scenarios** by gathering data from multiple sources
2. **Orchestrate multiple MCP servers** to collect comprehensive information
3. **Synthesize insights** from various data sources to make informed recommendations
4. **Provide clear, actionable advice** with detailed reasoning

You have access to multiple MCP servers that provide different types of data:
- **Perplexity**: Real-time web search and analysis for current market conditions
- **ChatGPT**: AI-powered currency analysis with OpenAI's latest insights
- **Market Data API**: Real-time price feeds and technical indicators

When analyzing financial decisions, always:
- Consider multiple data sources
- Provide clear reasoning for your recommendations
- Include confidence levels and risk assessments
- Suggest alternative scenarios
- Consider both short-term and long-term implications

Format your responses as structured JSON when appropriate, but also provide human-readable explanations.`;
  }

  /**
   * Main orchestration method for currency analysis
   */
  async analyzeCurrencyInvestment() {
    try {
      console.log('🧠 Claude Orchestrator: Starting comprehensive currency analysis...');
      
      // Step 1: Gather data from multiple sources
      const dataSources = await this.gatherDataSources();
      
      // Step 2: Ask Claude to analyze the combined data
      const analysis = await this.askClaudeForAnalysis(dataSources);
      
      // Step 3: Parse and format the response
      const result = this.parseClaudeResponse(analysis);
      
      console.log('✅ Claude Orchestrator: Analysis complete:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Claude Orchestrator: Error in analysis:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Gather data from multiple MCP servers
   */
  async gatherDataSources() {
    const dataSources = {};
    
    // Gather data from Perplexity using existing CurrencyAdvisorMCP
    try {
      console.log('🔍 Gathering data from Perplexity using CurrencyAdvisorMCP...');
      dataSources.perplexity = await this.mcpServers.perplexity.instance.execute();
    } catch (error) {
      console.warn('⚠️ Failed to gather Perplexity data:', error.message);
      dataSources.perplexity = { error: error.message };
    }

    // Gather data from ChatGPT
    try {
      console.log('🤖 Gathering data from ChatGPT...');
      dataSources.chatgpt = await this.mcpServers.chatgpt.instance.execute();
    } catch (error) {
      console.warn('⚠️ Failed to gather ChatGPT data:', error.message);
      dataSources.chatgpt = { error: error.message };
    }
    
    return dataSources;
  }



  /**
   * Ask Claude to analyze the combined data
   */
  async askClaudeForAnalysis(dataSources) {
    const prompt = this.buildAnalysisPrompt(dataSources);
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.1,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.content[0].text;
  }

  /**
   * Build a comprehensive prompt for Claude analysis
   */
  buildAnalysisPrompt(dataSources) {
    let prompt = `Please analyze the following data sources to provide a comprehensive EUR vs USD investment recommendation:

## Data Sources:

### Perplexity Analysis (via CurrencyAdvisorMCP):
${dataSources.perplexity && !dataSources.perplexity.error ? `
**Current Recommendation:**
- EUR: ${dataSources.perplexity.EUR}
- USD: ${dataSources.perplexity.USD}

**Detailed Reasoning:**
${dataSources.perplexity.reasoning}
` : 'No Perplexity data available'}

### ChatGPT Analysis:
${dataSources.chatgpt && !dataSources.chatgpt.error ? `
**Current Recommendation:**
- EUR: ${dataSources.chatgpt.EUR}
- USD: ${dataSources.chatgpt.USD}

**Detailed Reasoning:**
${dataSources.chatgpt.reasoning}
` : 'No ChatGPT data available'}





## Analysis Request:

Based on the above data sources, please provide:

1. **Investment Recommendation**: Specific percentages for EUR vs USD allocation (must sum to 100%)
2. **Detailed Reasoning**: Comprehensive analysis of factors supporting your recommendation
3. **Risk Assessment**: Key risks and uncertainties
4. **Confidence Level**: Your confidence in this recommendation (1-10 scale)
5. **Alternative Scenarios**: What could change this recommendation
6. **Time Horizon**: Short-term vs long-term considerations
7. **Data Source Weighting**: How much weight you gave to each data source

Please format your response as JSON with the following structure:
{
  "recommendation": {
    "EUR": "X%",
    "USD": "Y%"
  },
  "reasoning": "Detailed analysis...",
  "riskAssessment": "Key risks...",
  "confidenceLevel": 8,
  "alternativeScenarios": ["Scenario 1", "Scenario 2"],
  "timeHorizon": "Short-term: X, Long-term: Y",
  "dataSourceWeighting": {
    "perplexity": "High/Medium/Low",
    "chatgpt": "High/Medium/Low"
  }
}

Also provide a human-readable summary of your recommendation.`;

    return prompt;
  }

  /**
   * Parse Claude's response into structured format
   */
  parseClaudeResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          EUR: parsed.recommendation?.EUR || '50%',
          USD: parsed.recommendation?.USD || '50%',
          reasoning: parsed.reasoning || response,
          riskAssessment: parsed.riskAssessment,
          confidenceLevel: parsed.confidenceLevel,
          alternativeScenarios: parsed.alternativeScenarios,
          timeHorizon: parsed.timeHorizon,
          source: 'Claude Orchestrator with MCP Integration'
        };
      }
      
      // Fallback: extract percentages from text
      const eurMatch = response.match(/EUR[:\s]*(\d+)%/i);
      const usdMatch = response.match(/USD[:\s]*(\d+)%/i);
      
      if (eurMatch && usdMatch) {
        return {
          EUR: `${eurMatch[1]}%`,
          USD: `${usdMatch[1]}%`,
          reasoning: response,
          source: 'Claude Orchestrator with MCP Integration'
        };
      }
      
      // Final fallback
      return {
        EUR: '50%',
        USD: '50%',
        reasoning: response,
        source: 'Claude Orchestrator with MCP Integration'
      };
      
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Get fallback response when analysis fails
   */
  getFallbackResponse() {
    return {
      EUR: '50%',
      USD: '50%',
      reasoning: 'Analysis failed - using neutral probabilities as fallback. Please check API keys and network connectivity.',
      source: 'Claude Orchestrator (Fallback)'
    };
  }

  /**
   * Generic method to query any MCP server
   */
  async queryMCPServer(serverName, query) {
    if (!this.mcpServers[serverName]) {
      throw new Error(`MCP server '${serverName}' not configured`);
    }
    
    const server = this.mcpServers[serverName];
    
    // This is a generic template - implement specific logic for each server
    switch (serverName) {
      case 'perplexity':
        return await this.mcpServers.perplexity.instance.execute();
      case 'chatgpt':
        return await this.mcpServers.chatgpt.instance.execute();
      default:
        throw new Error(`No implementation for MCP server '${serverName}'`);
    }
  }

  /**
   * Add a new MCP server to the orchestrator
   */
  addMCPServer(name, config) {
    this.mcpServers[name] = config;
    console.log(`✅ Added MCP server: ${name}`);
  }

  /**
   * Get list of available MCP servers
   */
  getAvailableServers() {
    return Object.keys(this.mcpServers);
  }

  /**
   * Health check for all MCP servers
   */
  async healthCheck() {
    const health = {};
    
    for (const [name, server] of Object.entries(this.mcpServers)) {
      try {
        // Test each server's connectivity
        if (name === 'perplexity') {
          await this.mcpServers.perplexity.instance.execute();
          health[name] = { status: 'healthy', error: null };
        } else if (name === 'chatgpt') {
          await this.mcpServers.chatgpt.instance.execute();
          health[name] = { status: 'healthy', error: null };
        } else {
          health[name] = { status: 'not_implemented', error: 'No test method available' };
        }
      } catch (error) {
        health[name] = { status: 'unhealthy', error: error.message };
      }
    }
    
    return health;
  }
}

module.exports = ClaudeOrchestrator; 
