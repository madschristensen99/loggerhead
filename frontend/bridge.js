import axios from 'axios';
import { createPublicClient, createWalletClient, http } from 'viem';
import { flowMainnet } from 'viem/chains';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize public client
const ethereumClient = createPublicClient({
  chain: flowMainnet,
  transport: http()
});

async function fetchStargateRoutes(srcAddress, baseAmount = 10000) {
  try {
    // Calculate amount to bridge based on the difference from 50% to 60% (USD target)
    // If we start at 50-50 and want to get to 40-60, we need to move 10% of the total
    const percentageToMove = 10; // Moving from 50% to 60% means moving 10%
    const srcAmount = Math.floor(baseAmount * (percentageToMove / 100)).toString();
    const dstAmountMin = Math.floor(baseAmount * 0.09).toString(); // 90% of srcAmount as minimum received

    console.log(`🔄 Bridging ${percentageToMove}% of total position (${srcAmount} units) to achieve 60% USD allocation`);
    
    // Fetching route for USDC transfer from Ethereum to Polygon
    const response = await axios.get('https://stargate.finance/api/v1/quotes', {
      params: {
        srcToken: '0xF1815bd50389c46847f0Bda824eC8da914045D14', // USDC on Ethereum
        dstToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Polygon
        srcAddress: srcAddress,
        dstAddress: srcAddress, // Using same address as destination
        srcChainKey: 'flow',
        dstChainKey: 'base',
        srcAmount,
        dstAmountMin
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

export async function executeStargateTransaction(account) {
  try {
    // Create wallet client with the provided account
    const walletClient = createWalletClient({
      account,
      chain: flowMainnet,
      transport: http()
    });

    // 1. Fetch quotes data using the account's address
    const routesData = await fetchStargateRoutes(account.address);
    
    // 2. Get the first route
    const selectedRoute = routesData.quotes[0];
    if (!selectedRoute) {
      throw new Error('No quotes available');
    }
    
    console.log('Selected route:', selectedRoute);  

    // Execute all transactions in the route steps
    for (let i = 0; i < selectedRoute.steps.length; i++) {
      const executableTransaction = selectedRoute.steps[i].transaction;
      console.log(`Executing step ${i + 1}/${selectedRoute.steps.length}:`, executableTransaction);
      
      // Create transaction object
      const txParams = {
        account,
        to: executableTransaction.to,
        data: executableTransaction.data,
      };
      
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
