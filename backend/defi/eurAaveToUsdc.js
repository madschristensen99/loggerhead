import "dotenv/config";
import { createPublicClient, http, getContract, encodeFunctionData, parseUnits, formatUnits } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createBundlerClient, toSimple7702SmartAccount } from "viem/account-abstraction";
import { encodePacked, maxUint256, erc20Abi } from "viem";

// Environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PAYMASTER_V08_ADDRESS = process.env.PAYMASTER_V08_ADDRESS || "0x6C973eBe80dCD8660841D4356bf15c32460271C9"; // Official Circle Paymaster on Base
const RPC_URL = process.env.BASE_RPC || "https://base-mainnet.g.alchemy.com/v2/demo"; // Use your RPC endpoint

// Contract addresses on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const EURC_ADDRESS = "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42"; // EURC (Euro Coin) on Base
const AERODROME_ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";

// AAVE V3 addresses on Base
const AAVE_POOL_ADDRESS = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5"; // AAVE V3 Pool on Base
const AEURC_ADDRESS = "0x90DA57E0A6C0d166Bf15764E03b83745Dc90025B"; // aEURC token on Base

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

// AAVE V3 Pool ABI (minimal for withdrawing)
const aavePoolAbi = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" }
    ],
    name: "withdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" }
    ],
    name: "getUserAccountData",
    outputs: [
      { name: "totalCollateralBase", type: "uint256" },
      { name: "totalDebtBase", type: "uint256" },
      { name: "availableBorrowsBase", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  }
];

// EIP-2612 permit function
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
  
  console.log("Setting up Circle Paymaster integration for AAVE withdrawal + EURC to USDC swap...");

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

  const eurcContract = getContract({
    client,
    address: EURC_ADDRESS,
    abi: erc20Abi,
  });

  const routerContract = getContract({
    client,
    address: AERODROME_ROUTER,
    abi: routerAbi,
  });

  const aavePoolContract = getContract({
    client,
    address: AAVE_POOL_ADDRESS,
    abi: aavePoolAbi,
  });

  const aeurcContract = getContract({
    client,
    address: AEURC_ADDRESS,
    abi: erc20Abi,
  });

  console.log("\nWithdrawing EURC from AAVE and swapping to USDC via Aerodrome Router");

  // Check aEURC balance (what we have in AAVE)
  const aeurcBalance = await aeurcContract.read.balanceOf([account.address]);
  const eurcDecimals = 6; // EURC has 6 decimals
  const usdcDecimals = 6; // USDC has 6 decimals

  console.log(`\naEURC Balance in AAVE: ${formatUnits(aeurcBalance, eurcDecimals)}`);

  if (aeurcBalance === 0n) {
    console.log(`No aEURC balance found in AAVE for ${account.address}`);
    console.log("Make sure you have deposited EURC into AAVE first.");
    process.exit(1);
  }

  // Get current AAVE account data
  const accountData = await aavePoolContract.read.getUserAccountData([account.address]);
  console.log("\nCurrent AAVE Account Data:");
  console.log(`Total Collateral: ${formatUnits(accountData[0], 8)} (USD)`);
  console.log(`Total Debt: ${formatUnits(accountData[1], 8)} (USD)`);
  console.log(`Health Factor: ${formatUnits(accountData[5], 18)}`);

  // Set withdrawal amount (withdraw all aEURC)
  const withdrawAmount = aeurcBalance;

  console.log(`\nWithdrawing ${formatUnits(withdrawAmount, eurcDecimals)} EURC from AAVE...`);

  // After withdrawal, we'll have EURC that we need to swap to USDC
  // Try to find the best route for EURC → USDC
  let route;
  let expectedUsdcOut;

  // Try direct stable route first (both are stablecoins)
  try {
    route = [{ 
      from: EURC_ADDRESS, 
      to: USDC_ADDRESS, 
      stable: true,
      factory: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43" // Use default factory
    }];
    
    const amountsOut = await routerContract.read.getAmountsOut([withdrawAmount, route]);
    expectedUsdcOut = amountsOut[1];
    console.log("Using direct stable route EURC → USDC");
  } catch (error) {
    console.log("Direct stable route failed, trying volatile route");
    
    try {
      route = [{ 
        from: EURC_ADDRESS, 
        to: USDC_ADDRESS, 
        stable: false,
        factory: "0x0000000000000000000000000000000000000000"
      }];
      
      const amountsOut = await routerContract.read.getAmountsOut([withdrawAmount, route]);
      expectedUsdcOut = amountsOut[1];
      console.log("Using direct volatile route EURC → USDC");
    } catch (error2) {
      console.log("Direct routes failed, trying multi-hop through WETH");
      
      // Multi-hop route: EURC → WETH → USDC
      route = [
        { 
          from: EURC_ADDRESS, 
          to: "0x4200000000000000000000000000000000000006", // WETH
          stable: false,
          factory: "0x0000000000000000000000000000000000000000"
        },
        { 
          from: "0x4200000000000000000000000000000000000006", // WETH
          to: USDC_ADDRESS, 
          stable: false,
          factory: "0x0000000000000000000000000000000000000000"
        }
      ];
      
      const amountsOut = await routerContract.read.getAmountsOut([withdrawAmount, route]);
      expectedUsdcOut = amountsOut[2]; // Third element for 2-hop route
      console.log("Using multi-hop route EURC → WETH → USDC");
    }
  }

  if (!expectedUsdcOut) {
    throw new Error("No valid route found for EURC to USDC swap");
  }

  console.log(`Expected USDC output: ${formatUnits(expectedUsdcOut, usdcDecimals)}`);

  // Set minimum amount out (with 0.5% slippage tolerance)
  const slippageTolerance = 0.005; // 0.5%
  const minAmountOut = expectedUsdcOut * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / 1000n;

  console.log(`Minimum USDC output (with slippage): ${formatUnits(minAmountOut, usdcDecimals)}`);

  // Setup Circle Paymaster
  const paymasterAddress = PAYMASTER_V08_ADDRESS;
  const paymaster = {
    async getPaymasterData(parameters) {
      // For withdrawal operations, we'll use existing USDC balance or expected USDC output for fees
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
          const { standard: fees } = await bundlerClient.request({
            method: "pimlico_getUserOperationGasPrice",
          });
          
          const maxFeePerGas = BigInt(fees.maxFeePerGas);
          const maxPriorityFeePerGas = BigInt(fees.maxPriorityFeePerGas);
          
          console.log(`Gas prices - maxFeePerGas: ${maxFeePerGas}, maxPriorityFeePerGas: ${maxPriorityFeePerGas}`);
          
          return { maxFeePerGas, maxPriorityFeePerGas };
        } catch (error) {
          console.log("Failed to get Pimlico gas prices, using fallback:", error.message);
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

  console.log("\nExecuting AAVE withdrawal + EURC → USDC swap with Circle Paymaster...");

  // Execute the withdrawal + swap through the bundler
  const hash = await bundlerClient.sendUserOperation({
    account,
    calls: [
      // Withdraw EURC from AAVE (this burns aEURC and gives us EURC)
      {
        to: AAVE_POOL_ADDRESS,
        abi: aavePoolAbi,
        functionName: "withdraw",
        args: [
          EURC_ADDRESS, // asset
          withdrawAmount, // amount (use max uint256 to withdraw all)
          account.address, // to
        ],
      },
      // Approve the router to spend the withdrawn EURC
      {
        to: EURC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [AERODROME_ROUTER, withdrawAmount],
      },
      // Execute the swap EURC → USDC
      {
        to: AERODROME_ROUTER,
        abi: routerAbi,
        functionName: "swapExactTokensForTokens",
        args: [
          withdrawAmount,
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
  const finalEurcBalance = await eurcContract.read.balanceOf([account.address]);
  const finalAeurcBalance = await aeurcContract.read.balanceOf([account.address]);

  // Get updated AAVE account data
  const finalAccountData = await aavePoolContract.read.getUserAccountData([account.address]);

  console.log("\nFinal Balances:");
  console.log(`USDC: ${formatUnits(finalUsdcBalance, usdcDecimals)}`);
  console.log(`EURC: ${formatUnits(finalEurcBalance, eurcDecimals)}`);
  console.log(`aEURC (AAVE): ${formatUnits(finalAeurcBalance, eurcDecimals)}`);

  console.log("\nUpdated AAVE Account Data:");
  console.log(`Total Collateral: ${formatUnits(finalAccountData[0], 8)} (USD)`);
  console.log(`Total Debt: ${formatUnits(finalAccountData[1], 8)} (USD)`);
  console.log(`Available Borrows: ${formatUnits(finalAccountData[2], 8)} (USD)`);
  console.log(`Health Factor: ${formatUnits(finalAccountData[5], 18)}`);

  console.log("\nAAVE withdrawal + EURC to USDC swap completed successfully!");
  console.log("Gas fees paid with USDC via Circle Paymaster.");
  console.log(`View transaction: https://basescan.org/tx/${receipt.receipt.transactionHash}`);

  // Exit process
  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
