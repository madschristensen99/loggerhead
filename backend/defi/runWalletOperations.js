/**
 * Scheduled Wallet Operations Runner
 * 
 * This script runs wallet operations at scheduled intervals.
 * It identifies wallets with sufficient USDC balance and performs operations on them.
 */

const { processWalletsWithBalance, logWalletsWithBalance } = require('./walletOperations');

// Configuration
const INTERVAL_MINUTES = 60; // Run every hour
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

/**
 * Run wallet operations and schedule the next run
 */
async function runScheduledOperations() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Running scheduled wallet operations...`);
    
    // Log wallets with sufficient balance
    await logWalletsWithBalance();
    
    // Process wallets with sufficient balance
    await processWalletsWithBalance();
    
    console.log(`[${timestamp}] Scheduled operations completed. Next run in ${INTERVAL_MINUTES} minutes.`);
  } catch (error) {
    console.error('Error in scheduled operations:', error.message);
  }
}

// Run immediately on startup
console.log('Starting wallet operations scheduler...');
runScheduledOperations();

// Schedule recurring runs
setInterval(runScheduledOperations, INTERVAL_MS);

console.log(`Wallet operations scheduler running. Will process wallets every ${INTERVAL_MINUTES} minutes.`);
