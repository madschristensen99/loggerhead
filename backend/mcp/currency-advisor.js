const axios = require('axios');

class CurrencyAdvisorMCP {
  constructor() {
    this.name = 'currency-advisor';
    this.description = 'Uses Perplexity API to analyze real-time web data for EUR vs USD investment recommendations';
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.perplexityBaseUrl = 'https://api.perplexity.ai';
  }

  async analyzeInvestmentOpportunity() {
    try {
      console.log('🔍 Starting currency investment analysis with Perplexity...');
      
      if (!this.perplexityApiKey) {
        throw new Error('PERPLEXITY_API_KEY environment variable is required');
      }

      // Query Perplexity for comprehensive currency analysis
      const analysis = await this.queryPerplexity();
      
      // Parse the analysis and extract probabilities
      const probabilities = this.parseAnalysis(analysis);
      
      console.log('📊 Analysis complete:', probabilities);
      return probabilities;
      
    } catch (error) {
      console.error('❌ Error in currency analysis:', error);
      // Fallback to neutral if analysis fails
      return { EUR: '50%', USD: '50%' };
    }
  }

  async queryPerplexity() {
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
        Include brief reasoning for your recommendation.`
      },
      {
        role: "user",
        content: `Analyze the current market conditions and provide a recommendation for EUR vs USD investment allocation. 
        Consider the latest economic data, central bank policies, market sentiment, and technical indicators. 
        What percentage should be allocated to EUR and what percentage to USD for optimal investment strategy?`
      }
    ];

    try {
      console.log('🌐 Querying Perplexity API for currency analysis...');
      
      const response = await axios.post(
        `${this.perplexityBaseUrl}/chat/completions`,
        {
          model: "sonar",
          messages: messages,
          max_tokens: 1000,
          temperature: 0.1,
          top_p: 0.9,
          search_domain_filter: [
            "bloomberg.com",
            "reuters.com", 
            "ft.com",
            "wsj.com",
            "cnbc.com",
            "marketwatch.com",
            "investing.com",
            "yahoo.com",
            "ecb.europa.eu",
            "federalreserve.gov"
          ],
          include_search_results: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const analysis = response.data.choices[0].message.content;
      console.log('📝 Perplexity analysis received:', analysis.substring(0, 200) + '...');
      
      return analysis;
      
    } catch (error) {
      console.error('Failed to query Perplexity:', error.response?.data || error.message);
      throw error;
    }
  }

  parseAnalysis(analysis) {
    try {
      console.log('🔍 Parsing Perplexity analysis...');
      
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
            USD: `${usdPercent}%`
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
          USD: `${usdPercent}%`
        };
      }
      
      // If no clear percentages found, analyze sentiment
      return this.analyzeSentiment(analysis);
      
    } catch (error) {
      console.error('Error parsing analysis:', error);
      return this.analyzeSentiment(analysis);
    }
  }

  analyzeSentiment(analysis) {
    console.log('🎭 Analyzing sentiment as fallback...');
    
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
      USD: `${usdPercent}%`
    };
  }

  async execute() {
    return await this.analyzeInvestmentOpportunity();
  }
}

module.exports = CurrencyAdvisorMCP; 
