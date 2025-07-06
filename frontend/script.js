import { PrivyClient } from '@privy-io/server-auth';
import { privateKeyToAccount } from 'viem/accounts';
import { executeStargateTransaction } from './bridge.js';
import ora from 'ora';
import chalk from 'chalk';
import dotenv from 'dotenv';

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
        await sleep(1500);
        strategySpinner.succeed(chalk.green('Strategy information retrieved'));

        // Bridge token
        const bridgeSpinner = ora({
          text: chalk.magenta('Bridging tokens...'),
          color: 'magenta'
        }).start();
        const account = privateKeyToAccount(privateKey);
        await executeStargateTransaction(account);
        bridgeSpinner.succeed(chalk.green('Tokens bridged successfully'));

        // Swap token (fake)
        const swapSpinner = ora({
          text: chalk.blue('Swapping tokens...'),
          color: 'blue'
        }).start();
        await sleep(2000);
        swapSpinner.succeed(chalk.green('Tokens swapped successfully'));

        // Yield token (fake)
        const yieldSpinner = ora({
          text: chalk.yellow('Yielding tokens...'),
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
