import { PrivyClient } from '@privy-io/server-auth';
import { privateKeyToAccount } from 'viem/accounts';
import { executeStargateTransaction } from './bridge.js';

// Initialize Privy client
const privy = new PrivyClient(
  process.env.privyId,
  process.env.privySecret
);

async function main() {
  try {
    const users = await privy.getUsers();
    console.log('Total users:', users.length);

    for (const user of users) {
      try {
        const privateKey = user.customMetadata?.privateKey;

        if (!privateKey) {
          console.log('No private key for user:', user.id);
          continue;
        }
        
        const account = privateKeyToAccount(privateKey);
        await executeStargateTransaction(account);
      } catch (error) {
        console.error('Error processing user:', user.id, error);
      }
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
} 

main();