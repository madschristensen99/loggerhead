import "dotenv/config";
import { createPublicClient, http, getContract, encodeFunctionData, parseUnits, formatUnits } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createBundlerClient, toSimple7702SmartAccount } from "viem/account-abstraction";
import { encodePacked, maxUint256, erc20Abi } from "viem";

// Environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PAYMASTER_V08_ADDRESS = process.env.PAYMASTER_V08_ADDRESS || "0x6C973eBe80dCD8660841D4356bf15c32460271C9"; // Official Circle Paymaster on Base
const RPC_URL = process.env.BASE_RPC || "https://base-mainnet.g.alchemy.com/v2/demo"; // Use your DRPS endpoint

// Contract addresses on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"; // WETH on Base
const AERODROME_ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";

// We'll use USDC to WETH which has excellent liquidity on Aerodrome
// This will demonstrate the Circle Paymaster functionality effectively

// Chain configuration
const chain = base;

// ERC20 ABI extensions for permit
const eip2612Abi = [
  ...erc20Abi,
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    stateMutability: "view",
    type: "function",
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

// Aerodrome Router ABI
const routerAbi = [
  {
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { 
        name: "routes", 
        type: "tuple[]",
        components: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "stable", type: "bool" },
          { name: "factory", type: "address" }
        ]
      },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "swapExactTokensForTokens",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "amountIn", type: "uint256" },
      { 
        name: "routes", 
        type: "tuple[]",
        components: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "stable", type: "bool" },
          { name: "factory", type: "address" }
        ]
      }
    ],
    name: "getAmountsOut",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  }
];

// SlipStream pool ABI (Uniswap V3-like concentrated liquidity)
const slipstreamPoolAbi = [
  {
    inputs: [],
    name: "token0",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fee",
    outputs: [{ name: "", type: "uint24" }],
    stateMutability: "view",
    type: "function",
  }
];

// EIP-2612 permit function with retry logic
async function eip2612Permit({ token, chain, ownerAddress, spenderAddress, value }) {
  return {
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    domain: {
      name: "USD Coin", // USDC token name
      version: "2", // USDC version
      chainId: chain.id,
      verifyingContract: token.address,
    },
    message: {
      owner: ownerAddress,
      spender: spenderAddress,
      value,
      nonce: await token.read.nonces([ownerAddress]),
      deadline: maxUint256,
    },
  };
}

// Sign permit function
async function signPermit({ tokenAddress, client, account, spenderAddress, permitAmount }) {
  const token = getContract({
    client,
    address: tokenAddress,
    abi: eip2612Abi,
  });

  const permitData = await eip2612Permit({
    token,
    chain: client.chain,
    ownerAddress: account.address,
    spenderAddress,
    value: permitAmount,
  });

  const signature = await account.signTypedData(permitData);
  return signature;
}

async function main() {
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment variables");
  }

  // Format private key to ensure it has 0x prefix
  const formattedPrivateKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
  
  console.log("Setting up Circle Paymaster integration for Aerodrome swap...");

  // Setup client and account
  const client = createPublicClient({ 
    chain, 
    transport: http(RPC_URL, {
      retryCount: 3,
      retryDelay: 1000,
    })
  });
  const owner = privateKeyToAccount(formattedPrivateKey);
  const account = await toSimple7702SmartAccount({ client, owner });

  console.log("Smart Account Address:", account.address);
  console.log("Network:", client.chain.name);

  // Create contract instances
  const usdcContract = getContract({
    client,
    address: USDC_ADDRESS,
    abi: erc20Abi,
  });

  const wethContract = getContract({
    client,
    address: WETH_ADDRESS,
    abi: erc20Abi,
  });

  const routerContract = getContract({
    client,
    address: AERODROME_ROUTER,
    abi: routerAbi,
  });

  console.log("\nUsing Aerodrome Router for USDC to WETH swap");

  // Check USDC balance
  const usdcBalance = await usdcContract.read.balanceOf([account.address]);
  const usdcDecimals = 6; // USDC has 6 decimals
  const eurcDecimals = 6; // EURC has 6 decimals

  console.log(`\nUSDC Balance: ${formatUnits(usdcBalance, usdcDecimals)}`);

  if (usdcBalance === 0n) {
    console.log(`Fund ${account.address} with USDC on ${client.chain.name} using https://faucet.circle.com`);
    process.exit(1);
  }

  // Set swap amount (10 USDC)
  const swapAmount = parseUnits("10", usdcDecimals);

  if (usdcBalance < swapAmount) {
    throw new Error(`Insufficient USDC balance. Need ${formatUnits(swapAmount, usdcDecimals)} USDC`);
  }

  console.log(`\nSwapping ${formatUnits(swapAmount, usdcDecimals)} USDC to WETH...`);

  // USDC/WETH has excellent liquidity on Aerodrome, so this should work
  // Try volatile route (stablecoins to volatile assets typically use volatile pools)
  // Note: factory address of 0x0 means use default factory
  const route = [{ 
    from: USDC_ADDRESS, 
    to: WETH_ADDRESS, 
    stable: false,
    factory: "0x0000000000000000000000000000000000000000" // Use default factory
  }];

  // Get expected output amount
  const amountsOut = await routerContract.read.getAmountsOut([swapAmount, route]);
  const expectedWethOut = amountsOut[1];
  const wethDecimals = 18; // WETH has 18 decimals

  console.log(`Expected WETH output: ${formatUnits(expectedWethOut, wethDecimals)}`);

  // Set minimum amount out (with 0.5% slippage tolerance)
  const slippageTolerance = 0.005; // 0.5%
  const minAmountOut = expectedWethOut * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / 1000n;

  console.log(`Minimum WETH output (with slippage): ${formatUnits(minAmountOut, wethDecimals)}`);

  // Setup Circle Paymaster
  const paymasterAddress = PAYMASTER_V08_ADDRESS;
  const paymaster = {
    async getPaymasterData(parameters) {
      const permitAmount = parseUnits("100", usdcDecimals); // Allow paymaster to spend up to 100 USDC for fees
      const permitSignature = await signPermit({
        tokenAddress: USDC_ADDRESS,
        account,
        client,
        spenderAddress: paymasterAddress,
        permitAmount: permitAmount,
      });

      const paymasterData = encodePacked(
        ["uint8", "address", "uint256", "bytes"],
        [0, USDC_ADDRESS, permitAmount, permitSignature],
      );

      return {
        paymaster: paymasterAddress,
        paymasterData,
        paymasterVerificationGasLimit: 200000n,
        paymasterPostOpGasLimit: 15000n,
        isFinal: true,
      };
    },
  };

  // Setup bundler client
  const bundlerClient = createBundlerClient({
    account,
    client,
    paymaster,
    userOperation: {
      estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => {
        try {
          // Use Pimlico's gas price endpoint as suggested in the error
          const { standard: fees } = await bundlerClient.request({
            method: "pimlico_getUserOperationGasPrice",
          });
          
          const maxFeePerGas = BigInt(fees.maxFeePerGas);
          const maxPriorityFeePerGas = BigInt(fees.maxPriorityFeePerGas);
          
          console.log(`Gas prices - maxFeePerGas: ${maxFeePerGas}, maxPriorityFeePerGas: ${maxPriorityFeePerGas}`);
          
          return { maxFeePerGas, maxPriorityFeePerGas };
        } catch (error) {
          console.log("Failed to get Pimlico gas prices, using fallback:", error.message);
          // Fallback to higher gas prices based on the error message
          return {
            maxFeePerGas: 1000000n, // 1 gwei as fallback
            maxPriorityFeePerGas: 500000n, // 0.5 gwei as fallback
          };
        }
      },
    },
    transport: http(`https://public.pimlico.io/v2/${client.chain.id}/rpc`),
  });

  // Prepare transaction calls
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes from now

  // Sign authorization for 7702 account
  const authorization = await owner.signAuthorization({
    chainId: chain.id,
    nonce: await client.getTransactionCount({ address: owner.address }),
    contractAddress: account.authorization.address,
  });

  console.log("\nExecuting swap with Circle Paymaster (paying fees in USDC)...");

  // Execute the swap through the bundler
  const hash = await bundlerClient.sendUserOperation({
    account,
    calls: [
      // First approve the router to spend USDC
      {
        to: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [AERODROME_ROUTER, swapAmount],
      },
      // Then execute the swap
      {
        to: AERODROME_ROUTER,
        abi: routerAbi,
        functionName: "swapExactTokensForTokens",
        args: [
          swapAmount,
          minAmountOut,
          route,
          account.address,
          deadline,
        ],
      },
    ],
    authorization: authorization,
  });

  console.log("UserOperation hash:", hash);

  const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
  console.log("Transaction hash:", receipt.receipt.transactionHash);

  // Check final balances
  const finalUsdcBalance = await usdcContract.read.balanceOf([account.address]);
  const finalWethBalance = await wethContract.read.balanceOf([account.address]);

  console.log("\nFinal Balances:");
  console.log(`USDC: ${formatUnits(finalUsdcBalance, usdcDecimals)}`);
  console.log(`WETH: ${formatUnits(finalWethBalance, wethDecimals)}`);

  console.log("\nSwap completed successfully! Gas fees paid with USDC via Circle Paymaster.");
  console.log(`View transaction: https://basescan.org/tx/${receipt.receipt.transactionHash}`);

  // Exit process
  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
