const axios = require('axios');

class ChatGPTAdvisorMCP {
  constructor() {
    this.name = 'chatgpt-advisor';
    this.description = 'Uses OpenAI ChatGPT API to analyze currency investment opportunities with AI insights';
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = 'https://api.openai.com/v1';
  }

  async analyzeInvestmentOpportunity() {
    try {
      console.log('🤖 Starting currency investment analysis with ChatGPT...');
      
      if (!this.openaiApiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }

      // Query ChatGPT for comprehensive currency analysis
      const analysis = await this.queryChatGPT();
      
      // Parse the analysis and extract probabilities
      const result = this.parseAnalysis(analysis);
      
      console.log('📊 ChatGPT analysis complete:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error in ChatGPT analysis:', error);
      // Fallback to neutral if analysis fails
      return { 
        EUR: '50%', 
        USD: '50%',
        reasoning: 'ChatGPT analysis failed - using neutral probabilities as fallback',
        source: 'ChatGPT Advisor MCP'
      };
    }
  }

  async queryChatGPT() {
    const messages = [
      {
        role: "system",
        content: `You are a financial analyst specializing in currency investment analysis. 
        Analyze the current market conditions for EUR vs USD investment opportunities.
        Consider factors like:
        - Current exchange rates and trends
        - Economic indicators (inflation, interest rates, GDP growth)
        - Central bank policies (ECB vs Federal Reserve)
        - Market sentiment and technical analysis
        - Geopolitical factors affecting both currencies
        
        Provide a clear recommendation with specific percentages for EUR vs USD investment allocation.
        Format your response as: "Based on current analysis, I recommend EUR: X% and USD: Y% where X+Y=100"
        Include detailed reasoning for your recommendation, focusing on the most recent market developments.`
      },
      {
        role: "user",
        content: `Analyze the current market conditions and provide a recommendation for EUR vs USD investment allocation. 
        Consider the latest economic data, central bank policies, market sentiment, and technical indicators. 
        What percentage should be allocated to EUR and what percentage to USD for optimal investment strategy?
        Please provide specific percentages and detailed reasoning.`
      }
    ];

    try {
      console.log('🌐 Querying ChatGPT API for currency analysis...');
      
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: "gpt-4o-mini",
          messages: messages,
          max_tokens: 1500,
          temperature: 0.1,
          top_p: 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const analysis = response.data.choices[0].message.content;
      console.log('📝 ChatGPT analysis received:', analysis.substring(0, 200) + '...');
      
      return analysis;
      
    } catch (error) {
      console.error('Failed to query ChatGPT:', error.response?.data || error.message);
      throw error;
    }
  }

  parseAnalysis(analysis) {
    try {
      console.log('🔍 Parsing ChatGPT analysis...');
      
      // Look for percentage patterns in the response
      const eurMatch = analysis.match(/EUR[:\s]*(\d+)%/i);
      const usdMatch = analysis.match(/USD[:\s]*(\d+)%/i);
      
      if (eurMatch && usdMatch) {
        const eurPercent = parseInt(eurMatch[1]);
        const usdPercent = parseInt(usdMatch[1]);
        
        // Validate that percentages sum to approximately 100
        if (Math.abs(eurPercent + usdPercent - 100) <= 5) {
          return {
            EUR: `${eurPercent}%`,
            USD: `${usdPercent}%`,
            reasoning: analysis,
            source: 'ChatGPT Advisor MCP'
          };
        }
      }
      
      // Fallback: Look for any percentage mentions and estimate
      const allPercentages = analysis.match(/(\d+)%/g);
      if (allPercentages && allPercentages.length >= 2) {
        const percentages = allPercentages.map(p => parseInt(p));
        const eurPercent = percentages[0];
        const usdPercent = 100 - eurPercent;
        
        return {
          EUR: `${eurPercent}%`,
          USD: `${usdPercent}%`,
          reasoning: analysis,
          source: 'ChatGPT Advisor MCP'
        };
      }
      
      // If no clear percentages found, analyze sentiment
      const sentimentResult = this.analyzeSentiment(analysis);
      return {
        ...sentimentResult,
        reasoning: analysis,
        source: 'ChatGPT Advisor MCP'
      };
      
    } catch (error) {
      console.error('Error parsing ChatGPT analysis:', error);
      return this.analyzeSentiment(analysis);
    }
  }

  analyzeSentiment(analysis) {
    console.log('🎭 Analyzing ChatGPT sentiment as fallback...');
    
    const analysisLower = analysis.toLowerCase();
    
    // Look for positive/negative indicators for each currency
    const eurPositive = ['euro', 'eur', 'european', 'ecb'].some(term => 
      analysisLower.includes(term) && 
      (analysisLower.includes('strong') || analysisLower.includes('positive') || analysisLower.includes('bullish'))
    );
    
    const usdPositive = ['dollar', 'usd', 'federal', 'fed'].some(term => 
      analysisLower.includes(term) && 
      (analysisLower.includes('strong') || analysisLower.includes('positive') || analysisLower.includes('bullish'))
    );
    
    const eurNegative = ['euro', 'eur', 'european', 'ecb'].some(term => 
      analysisLower.includes(term) && 
      (analysisLower.includes('weak') || analysisLower.includes('negative') || analysisLower.includes('bearish'))
    );
    
    const usdNegative = ['dollar', 'usd', 'federal', 'fed'].some(term => 
      analysisLower.includes(term) && 
      (analysisLower.includes('weak') || analysisLower.includes('negative') || analysisLower.includes('bearish'))
    );
    
    // Calculate probabilities based on sentiment
    let eurScore = 50;
    let usdScore = 50;
    
    if (eurPositive && !eurNegative) eurScore += 20;
    if (usdPositive && !usdNegative) usdScore += 20;
    if (eurNegative && !eurPositive) eurScore -= 20;
    if (usdNegative && !usdPositive) usdScore -= 20;
    
    // Normalize to ensure they sum to 100
    const total = eurScore + usdScore;
    const eurPercent = Math.round((eurScore / total) * 100);
    const usdPercent = 100 - eurPercent;
    
    return {
      EUR: `${eurPercent}%`,
      USD: `${usdPercent}%`,
      source: 'ChatGPT Advisor MCP'
    };
  }

  async execute() {
    return await this.analyzeInvestmentOpportunity();
  }
}

module.exports = ChatGPTAdvisorMCP; 