const express = require('express');
const router = express.Router();
const ClaudeOrchestrator = require('../claude-orchestrator');
const CurrencyAdvisorMCP = require('../mcp/currency-advisor');

// Initialize the Claude orchestrator
const claudeOrchestrator = new ClaudeOrchestrator();

/**
 * @route   GET /ai-currency
 * @desc    Get AI-powered currency investment recommendation using Claude orchestrator
 * @access  Public
 */
router.get('/', async function(req, res, next) {
  try {
    console.log('🧠 Starting AI-powered currency analysis with Claude orchestrator...');
    
    const result = await claudeOrchestrator.analyzeCurrencyInvestment();
    
    console.log('✅ AI analysis complete, returning result:', result);
    res.json(result);
    
  } catch (err) {
    console.error('❌ Error in AI currency route:', err);
    next(err);
  }
});

/**
 * @route   GET /ai-currency/health
 * @desc    Check health of all MCP servers
 * @access  Public
 */
router.get('/health', async function(req, res, next) {
  try {
    console.log('🏥 Checking MCP server health...');
    
    const health = await claudeOrchestrator.healthCheck();
    
    res.json({
      status: 'success',
      data: {
        orchestrator: 'Claude AI Orchestrator',
        timestamp: new Date().toISOString(),
        mcpServers: health
      }
    });
    
  } catch (err) {
    console.error('❌ Error in health check:', err);
    next(err);
  }
});

/**
 * @route   GET /ai-currency/servers
 * @desc    Get list of available MCP servers
 * @access  Public
 */
router.get('/servers', function(req, res, next) {
  try {
    const servers = claudeOrchestrator.getAvailableServers();
    
    res.json({
      status: 'success',
      data: {
        availableServers: servers,
        totalServers: servers.length,
        orchestrator: 'Claude AI Orchestrator'
      }
    });
    
  } catch (err) {
    console.error('❌ Error getting server list:', err);
    next(err);
  }
});

/**
 * @route   POST /ai-currency/query
 * @desc    Query a specific MCP server
 * @access  Public
 */
router.post('/query', async function(req, res, next) {
  try {
    const { serverName, query } = req.body;
    
    if (!serverName) {
      return res.status(400).json({
        status: 'error',
        message: 'Server name is required'
      });
    }
    
    console.log(`🔍 Querying MCP server: ${serverName}`);
    
    const result = await claudeOrchestrator.queryMCPServer(serverName, query);
    
    res.json({
      status: 'success',
      data: {
        serverName,
        query,
        result,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (err) {
    console.error('❌ Error querying MCP server:', err);
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
});

/**
 * @route   POST /ai-currency/add-server
 * @desc    Add a new MCP server to the orchestrator
 * @access  Public
 */
router.post('/add-server', function(req, res, next) {
  try {
    const { name, config } = req.body;
    
    if (!name || !config) {
      return res.status(400).json({
        status: 'error',
        message: 'Server name and configuration are required'
      });
    }
    
    claudeOrchestrator.addMCPServer(name, config);
    
    res.json({
      status: 'success',
      message: `MCP server '${name}' added successfully`,
      data: {
        name,
        availableServers: claudeOrchestrator.getAvailableServers()
      }
    });
    
  } catch (err) {
    console.error('❌ Error adding MCP server:', err);
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
});

/**
 * @route   GET /ai-currency/comparison
 * @desc    Compare AI orchestrator vs direct Perplexity analysis
 * @access  Public
 */
router.get('/comparison', async function(req, res, next) {
  try {
    console.log('🔄 Running comparison analysis...');
    
    // Get AI orchestrator result
    const aiResult = await claudeOrchestrator.analyzeCurrencyInvestment();
    
    // Get direct Perplexity result (for comparison)
    const directPerplexity = await (new CurrencyAdvisorMCP()).execute();
    
    res.json({
      status: 'success',
      data: {
        aiOrchestrator: {
          EUR: aiResult.EUR,
          USD: aiResult.USD,
          reasoning: aiResult.reasoning,
          confidenceLevel: aiResult.confidenceLevel,
          riskAssessment: aiResult.riskAssessment,
          source: aiResult.source
        },
        directPerplexity: directPerplexity,
        comparison: {
          aiAdvantage: 'Multi-source analysis with intelligent synthesis',
          directAdvantage: 'Raw web search results',
          recommendation: 'AI orchestrator provides more comprehensive analysis'
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (err) {
    console.error('❌ Error in comparison analysis:', err);
    next(err);
  }
});

module.exports = router; 