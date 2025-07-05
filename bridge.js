import axios from 'axios';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { flowMainnet } from 'viem/chains';
import * as dotenv from 'dotenv';
dotenv.config();

// Replace with your actual private key - NEVER hardcode in production code
const PRIVATE_KEY = process.env.EVM_PRIVATE_KEY;
const account = privateKeyToAccount(PRIVATE_KEY);

// Initialize clients
const ethereumClient = createPublicClient({
  chain: flowMainnet,
  transport: http()
});

const walletClient = createWalletClient({
  account,
  chain: flowMainnet,
  transport: http()
});

async function fetchStargateRoutes() {
  try {
    // Fetching route for USDC transfer from Ethereum to Polygon - https://docs.stargate.finance
    const response = await axios.get('https://stargate.finance/api/v1/quotes', {
      params: {
        srcToken: '0xF1815bd50389c46847f0Bda824eC8da914045D14', // USDC on Ethereum
        dstToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Polygon
        srcAddress: '0x5228062c16A5c023ae598F0326D5f806Aa6a9c8E',
        dstAddress: '0x5228062c16A5c023ae598F0326D5f806Aa6a9c8E',
        srcChainKey: 'flow', // All chainKeys - https://stargate.finance/api/v1/chains
        dstChainKey: 'base',
        srcAmount: '10000', // 1 USDC (6 decimals)
        dstAmountMin: '9000' // Amount to receive deducted by Stargate fees (max 0.15%)
      }
    });
    
    console.log('Stargate quotes data:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

async function executeStargateTransaction() {
  try {
    // 1. Fetch quotes data
    const routesData = await fetchStargateRoutes();
    
    // 2. Get the first route (or implement your own selection logic)
    // Here you can select from all the supported routes including StargateV2:Taxi, StargateBus or CCTP
    // Supported routes are different for each token
    // Each route contains all transactions required to execute the transfer given in executable order
    const selectedRoute = routesData.quotes[0];
    if (!selectedRoute) {
      throw new Error('No quotes available');
    }
    
    console.log('Selected route:', selectedRoute);  

    // Execute all transactions in the route steps
    for (let i = 0; i < selectedRoute.steps.length; i++) {
      const executableTransaction = selectedRoute.steps[i].transaction;
      console.log(`Executing step ${i + 1}/${selectedRoute.steps.length}:`, executableTransaction);
      
      // Create transaction object, only include value if it exists and is not empty
      const txParams = {
        account,
        to: executableTransaction.to,
        data: executableTransaction.data,
      };
      
      // Only add value if it exists and is not empty
      if (executableTransaction.value && executableTransaction.value !== '0') {
        txParams.value = BigInt(executableTransaction.value);
      }
      
      // Execute the transaction
      const txHash = await walletClient.sendTransaction(txParams);
      console.log(`Step ${i + 1} transaction hash: ${txHash}`);
      
      // Wait for transaction to be mined
      const receipt = await ethereumClient.waitForTransactionReceipt({ hash: txHash });
      console.log(`Step ${i + 1} transaction confirmed:`, receipt);
    }
    
    console.log('All steps executed successfully');
    return true;
  } catch (error) {
    console.error('Error executing Stargate transaction:', error);
    throw error;
  }
}

// Execute the transaction
executeStargateTransaction()
  .then(() => {
    console.log('Successfully executed Stargate transaction');
  })
  .catch((err) => {
    console.error('Failed to execute Stargate transaction:', err);
  });
