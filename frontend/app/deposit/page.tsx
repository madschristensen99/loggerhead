"use client";

import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ABIs
const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const aerodromeRouterAbi = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

const aavePoolAbi = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external"
];

// Helper function to ensure private key has 0x prefix
const normalizePrivateKey = (key: string) => {
  return key.startsWith('0x') ? key : `0x${key}`;
};

// Helper function to normalize private key format


export default function DepositPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDeposit = async () => {
    if (!amount) {
      setError("Please enter an amount");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const privateKey = user?.customMetadata?.privateKey;
      if (!privateKey || typeof privateKey !== 'string') {
        throw new Error("No private key found or invalid private key format");
      }

      const normalizedPrivateKey = normalizePrivateKey(privateKey);
      
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const wallet = new ethers.Wallet(normalizedPrivateKey, provider);
      console.log('Wallet initialized:', wallet.address);

      // Addresses on Base
      const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      const eurcAddress = "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c";
      const aavePoolAddress = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";
      const aerodromeRouterAddress = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";

      // Contracts
      const usdc = new ethers.Contract(usdcAddress, erc20Abi, wallet);
      const eurc = new ethers.Contract(eurcAddress, erc20Abi, wallet);
      const aavePool = new ethers.Contract(aavePoolAddress, aavePoolAbi, wallet);
      const aerodromeRouter = new ethers.Contract(aerodromeRouterAddress, aerodromeRouterAbi, wallet);

      // Check USDC balance before proceeding
      const decimals = await usdc.decimals();
      const balance = await usdc.balanceOf(wallet.address);
      const humanBalance = ethers.formatUnits(balance, decimals);
      console.log('Current USDC balance:', humanBalance);

      if (balance < ethers.parseUnits(amount, decimals)) {
        throw new Error(`Insufficient USDC balance. You have ${humanBalance} USDC`);
      }

      // Convert amount to proper decimal units
      const amountInWei = ethers.parseUnits(amount, decimals);
      console.log('Amount to trade in wei:', amountInWei.toString());

      // Steps
      // 1. Approve USDC for Aerodrome Router
      console.log('Approving USDC spend for Aerodrome...');
      const approveAerodromeTx = await usdc.approve(aerodromeRouterAddress, amountInWei);
      console.log('Approval transaction hash:', approveAerodromeTx.hash);
      await approveAerodromeTx.wait();
      console.log('Aerodrome approval confirmed');

      // 2. Swap USDC to EURC on Aerodrome
      console.log('Swapping USDC to EURC on Aerodrome...');
      const path = [usdcAddress, eurcAddress];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
      const swapTx = await aerodromeRouter.swapExactTokensForTokens(
        amountInWei,
        0, // Accept any amount of EURC (we should use a better minimum in production)
        path,
        wallet.address,
        deadline
      );
      console.log('Swap transaction hash:', swapTx.hash);
      await swapTx.wait();
      console.log('Swap confirmed');
      
      // 3. Check EURC balance after swap
      const eurcBalance = await eurc.balanceOf(wallet.address);
      const eurcDecimals = await eurc.decimals();
      const humanEurcBalance = ethers.formatUnits(eurcBalance, eurcDecimals);
      console.log('EURC balance after swap:', humanEurcBalance);
      
      // 4. Approve EURC for Aave
      console.log('Approving EURC spend for Aave...');
      const approveAaveTx = await eurc.approve(aavePoolAddress, eurcBalance);
      console.log('Aave approval transaction hash:', approveAaveTx.hash);
      await approveAaveTx.wait();
      console.log('Aave approval confirmed');
      
      // 5. Supply EURC to Aave
      console.log('Supplying EURC to Aave...');
      const supplyTx = await aavePool.supply(eurcAddress, eurcBalance, wallet.address, 0);
      console.log('Supply transaction hash:', supplyTx.hash);
      await supplyTx.wait();
      console.log('Supply to Aave confirmed');

      setSuccess(true);
    } catch (err) {
      console.error("Deposit error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during deposit");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Auto Trade & Deposit</h1>
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm border">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-medium text-gray-900">Your Private Key</h2>
              <p className="font-mono break-all text-sm bg-gray-50 p-4 rounded-md">
                {user?.customMetadata?.privateKey || 'No private key found'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                Amount to Deposit
              </label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g. 1.5)"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm">
                Successfully traded {amount} USDC to EURC and deposited to Aave!
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={isLoading || !amount}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading || !amount ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Processing...' : 'Auto Trade & Deposit to Aave'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 