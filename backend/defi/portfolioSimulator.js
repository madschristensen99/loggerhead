/**
 * Portfolio Simulator Module
 * 
 * This module uses the Claude AI Orchestrator to generate portfolio recommendations
 * based on real-time market analysis and wallet data.
 */

const axios = require('axios');

/**
 * Get portfolio allocation recommendation from Claude AI Orchestrator
 * 
 * @param {Object} walletData - Data about the wallet
 * @param {string} walletData.address - Wallet address
 * @param {string} walletData.usdcBalance - USDC balance in smallest units
 * @param {string} walletData.usdcBalanceFormatted - Formatted USDC balance
 * @returns {Promise<Object>} - Portfolio allocation recommendation
 */
async function getDesiredPortfolio(walletData) {
  console.log(`🤖 Querying Claude AI Orchestrator for wallet ${walletData.address} with ${walletData.usdcBalanceFormatted} USDC`);
  
  try {
    // Call the Claude AI Orchestrator API
    const response = await axios.get(`${process.env.BACKEND_API_URL || 'http://localhost:3000'}/ai-currency`, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error(`AI Orchestrator returned status ${response.status}`);
    }

    const aiResult = response.data;
    console.log('📊 Claude AI Orchestrator response:', aiResult);

    // Parse the AI response to extract EUR and USD percentages
    const eurPercentage = parseFloat(aiResult.EUR.replace('%', '')) / 100;
    const usdPercentage = parseFloat(aiResult.USD.replace('%', '')) / 100;

    // Validate that percentages sum to approximately 1
    const totalPercentage = eurPercentage + usdPercentage;
    if (Math.abs(totalPercentage - 1) > 0.01) {
      console.warn(`⚠️ AI percentages don't sum to 100%: EUR ${eurPercentage * 100}% + USD ${usdPercentage * 100}% = ${totalPercentage * 100}%`);
      
      // Normalize to ensure they sum to 1
      const normalizedEur = eurPercentage / totalPercentage;
      const normalizedUsd = usdPercentage / totalPercentage;
      
      console.log(`🔄 Normalized to: EUR ${normalizedEur * 100}% + USD ${normalizedUsd * 100}%`);
      
      return {
        success: true,
        portfolio: {
          EUR: normalizedEur,
          USD: normalizedUsd
        },
        reasoning: aiResult.reasoning || "AI-generated portfolio allocation based on current market conditions.",
        confidenceLevel: aiResult.confidenceLevel,
        riskAssessment: aiResult.riskAssessment,
        alternativeScenarios: aiResult.alternativeScenarios,
        timeHorizon: aiResult.timeHorizon,
        source: aiResult.source || 'Claude AI Orchestrator',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      portfolio: {
        EUR: eurPercentage,
        USD: usdPercentage
      },
      reasoning: aiResult.reasoning || "AI-generated portfolio allocation based on current market conditions.",
      confidenceLevel: aiResult.confidenceLevel,
      riskAssessment: aiResult.riskAssessment,
      alternativeScenarios: aiResult.alternativeScenarios,
      timeHorizon: aiResult.timeHorizon,
      source: aiResult.source || 'Claude AI Orchestrator',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error calling Claude AI Orchestrator:', error.message);
    
    // Fallback to a conservative allocation if AI service is unavailable
    console.log('🔄 Falling back to conservative allocation (60% USD, 40% EUR)');
    
    return {
      success: true,
      portfolio: {
        EUR: 0.4, // 40%
        USD: 0.6  // 60%
      },
      reasoning: "Conservative allocation due to AI service unavailability. Maintaining higher USD allocation for stability.",
      confidenceLevel: 5,
      riskAssessment: "Using fallback allocation - AI analysis unavailable",
      alternativeScenarios: ["AI service restoration", "Manual override"],
      timeHorizon: "Short-term: Conservative, Long-term: AI-dependent",
      source: 'Fallback Allocation',
      timestamp: new Date().toISOString(),
      fallback: true
    };
  }
}

/**
 * Calculate actual amounts based on portfolio percentages
 * 
 * @param {Object} portfolio - Portfolio allocation percentages
 * @param {number} totalAmount - Total amount to allocate
 * @returns {Object} - Amounts for each asset
 */
function calculateAmounts(portfolio, totalAmount) {
  const amounts = {};
  
  for (const [asset, percentage] of Object.entries(portfolio)) {
    amounts[asset] = totalAmount * percentage;
  }
  
  return amounts;
}

/**
 * Generate a portfolio recommendation for a wallet
 * 
 * @param {Object} walletData - Wallet data
 * @returns {Promise<Object>} - Portfolio recommendation
 */
async function generatePortfolioRecommendation(walletData) {
  try {
    // Get desired portfolio allocation
    const portfolioResponse = await getDesiredPortfolio(walletData);
    
    if (!portfolioResponse.success) {
      throw new Error('Failed to get portfolio recommendation');
    }
    
    // Calculate actual amounts based on wallet balance
    const totalBalance = parseFloat(walletData.usdcBalanceFormatted);
    const amounts = calculateAmounts(portfolioResponse.portfolio, totalBalance);
    
    // Create recommendation object
    const recommendation = {
      walletAddress: walletData.address,
      currentBalance: {
        USDC: totalBalance
      },
      recommendedPortfolio: portfolioResponse.portfolio,
      recommendedAmounts: amounts,
      reasoning: portfolioResponse.reasoning,
      confidenceLevel: portfolioResponse.confidenceLevel,
      riskAssessment: portfolioResponse.riskAssessment,
      alternativeScenarios: portfolioResponse.alternativeScenarios,
      timeHorizon: portfolioResponse.timeHorizon,
      source: portfolioResponse.source,
      fallback: portfolioResponse.fallback || false,
      timestamp: portfolioResponse.timestamp
    };
    
    return recommendation;
  } catch (error) {
    console.error('Error generating portfolio recommendation:', error.message);
    throw error;
  }
}

/**
 * Get detailed AI analysis from Claude Orchestrator
 * 
 * @param {Object} walletData - Wallet data
 * @returns {Promise<Object>} - Detailed AI analysis
 */
async function getDetailedAIAnalysis(walletData) {
  try {
    console.log(`🔍 Getting detailed AI analysis for wallet ${walletData.address}`);
    
    // Get the full AI analysis including health check
    const [aiResponse, healthResponse] = await Promise.allSettled([
      axios.get(`${process.env.BACKEND_API_URL || 'http://localhost:3000'}/ai-currency`),
      axios.get(`${process.env.BACKEND_API_URL || 'http://localhost:3000'}/ai-currency/health`)
    ]);

    const analysis = {
      aiStatus: 'unknown',
      mcpServers: {},
      lastAnalysis: null,
      timestamp: new Date().toISOString()
    };

    if (aiResponse.status === 'fulfilled') {
      analysis.lastAnalysis = aiResponse.value.data;
    }

    if (healthResponse.status === 'fulfilled') {
      analysis.aiStatus = 'healthy';
      analysis.mcpServers = healthResponse.value.data.mcpServers;
    } else {
      analysis.aiStatus = 'unhealthy';
    }

    return analysis;
  } catch (error) {
    console.error('❌ Error getting detailed AI analysis:', error.message);
    return {
      aiStatus: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generate a comprehensive portfolio recommendation with AI analysis
 * 
 * @param {Object} walletData - Wallet data
 * @returns {Promise<Object>} - Comprehensive portfolio recommendation
 */
async function generateComprehensiveRecommendation(walletData) {
  try {
    console.log(`🎯 Generating comprehensive AI-driven recommendation for wallet ${walletData.address}`);
    
    // Get both portfolio recommendation and detailed AI analysis
    const [portfolioRec, aiAnalysis] = await Promise.all([
      generatePortfolioRecommendation(walletData),
      getDetailedAIAnalysis(walletData)
    ]);

    return {
      ...portfolioRec,
      aiAnalysis: aiAnalysis,
      comprehensive: true
    };
  } catch (error) {
    console.error('❌ Error generating comprehensive recommendation:', error.message);
    throw error;
  }
}

module.exports = {
  getDesiredPortfolio,
  calculateAmounts,
  generatePortfolioRecommendation,
  getDetailedAIAnalysis,
  generateComprehensiveRecommendation
};
