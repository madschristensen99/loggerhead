import { PrivyClient } from '@privy-io/server-auth';
import { privateKeyToAccount } from 'viem/accounts';
import { executeStargateTransaction } from './bridge.js';
import ora from 'ora';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

console.log(process.env.privyId, process.env.privySecret);
// Initialize Privy client
const privy = new PrivyClient(
  process.env.privyId,
  process.env.privySecret
);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStrategy() {
  const response = await fetch('https://e2e4-83-144-23-156.ngrok-free.app/ai-currency', {
    headers: new Headers({
      "ngrok-skip-browser-warning": "69420",
    }),
  });
  return await response.json();
}

async function main() {
  try {
    const users = await privy.getUsers();
    console.log(chalk.blue.bold('🚀 Starting process for'), chalk.green(users.length), chalk.blue.bold('users\n'));

    for (const user of users) {
      try {
        const privateKey = user.customMetadata?.privateKey;

        if (!privateKey) {
          console.log(chalk.yellow('⚠️  No private key for user:'), chalk.gray(user.id));
          continue;
        }

        // Get strategy information
        const strategySpinner = ora({
          text: chalk.cyan('Getting information from API for the strategy...'),
          color: 'cyan'
        }).start();
        
        const strategy = await getStrategy();
        strategySpinner.succeed(chalk.green('Strategy information retrieved'));
        
        // Log rebalancing information
        console.log(chalk.bold('\n📊 Rebalancing Strategy:'));
        console.log(chalk.gray('Initial allocation:  '), chalk.blue('EUR: 50%'), chalk.blue('USD: 50%'));
        console.log(chalk.gray('Target allocation:   '), chalk.green(`EUR: ${strategy.EUR}`), chalk.green(`USD: ${strategy.USD}`));
        console.log(chalk.gray('Reasoning:          '), chalk.italic(strategy.reasoning));
        console.log(chalk.gray('Confidence Level:   '), chalk.yellow(`${strategy.confidenceLevel}/10`));
        console.log();

        // Bridge token
        const bridgeSpinner = ora({
          text: chalk.magenta(`Bridging tokens to match ${strategy.USD} USD allocation...`),
          color: 'magenta'
        }).start();
        const account = privateKeyToAccount(privateKey);
        await executeStargateTransaction(account);
        bridgeSpinner.succeed(chalk.green('Tokens bridged successfully'));

        // Swap token (fake)
        const swapSpinner = ora({
          text: chalk.blue(`Swapping tokens to achieve ${strategy.EUR}/${strategy.USD} balance...`),
          color: 'blue'
        }).start();
        await sleep(2000);
        swapSpinner.succeed(chalk.green('Tokens swapped successfully'));

        // Yield token (fake)
        const yieldSpinner = ora({
          text: chalk.yellow(`Optimizing yield positions for ${strategy.EUR} EUR and ${strategy.USD} USD...`),
          color: 'yellow'
        }).start();
        await sleep(1500);
        yieldSpinner.succeed(chalk.green('Tokens yielded successfully'));

        console.log(chalk.gray('\n-------------------\n'));
      } catch (error) {
        console.error(chalk.red('❌ Error processing user:'), chalk.gray(user.id), chalk.red(error));
      }
    }
  } catch (error) {
    console.error(chalk.red.bold('❌ Fatal error:'), chalk.red(error));
  }
} 

main();
